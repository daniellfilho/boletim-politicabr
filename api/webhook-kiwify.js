/**
 * API Route (Vercel Serverless Function)
 * ----------------------------------------
 * Recebe os webhooks da Kiwify (compra aprovada, cancelamento, reembolso,
 * chargeback, renovação) e atualiza o status do assinante no Supabase.
 *
 * Configuração necessária na Kiwify (Apps -> Webhooks -> Criar webhook):
 *   - URL do Webhook: https://SEU-SITE.vercel.app/api/webhook-kiwify?token=SEU_TOKEN_SECRETO
 *     (o "?token=..." é escolhido por você - qualquer texto longo e aleatório serve,
 *      é a forma mais simples de garantir que só a Kiwify consiga chamar essa URL)
 *   - Eventos a marcar: Compra aprovada, Assinatura renovada, Compra recusada,
 *     Reembolso, Chargeback, Assinatura cancelada
 *
 * Variáveis de ambiente necessárias na Vercel:
 *   KIWIFY_WEBHOOK_TOKEN      -> o mesmo texto que você colocou no "?token=" acima
 *   SUPABASE_URL              -> ver robo/SUPABASE.md
 *   SUPABASE_SERVICE_ROLE_KEY -> ver robo/SUPABASE.md
 *   SITE_URL                  -> ex: https://boletim-politicabr.vercel.app
 *   RESEND_API_KEY            -> já configurada (e-mail de boas-vindas)
 *   FROM_EMAIL                -> já configurada (opcional)
 *
 * IMPORTANTE: os nomes exatos dos campos abaixo (Customer.email, order_status
 * etc.) foram escritos com base na documentação pública da Kiwify, mas o
 * formato pode variar um pouco conforme sua conta. Depois de configurar,
 * use o botão "Testar Webhook" no painel da Kiwify e confira, nos logs da
 * função na Vercel (aba Deployments -> Functions -> Logs), a linha que
 * começa com "[webhook-kiwify] Payload recebido" - ela mostra exatamente
 * o formato que chegou, para ajustar os caminhos abaixo se necessário.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KIWIFY_WEBHOOK_TOKEN = process.env.KIWIFY_WEBHOOK_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Boletim PoliticaBR <onboarding@resend.dev>';
const SITE_URL = process.env.SITE_URL || '';

// Eventos que LIBERAM acesso
// Valores conhecidos de "order.order_status" que LIBERAM acesso
const STATUS_ATIVA = ['paid', 'approved', 'renewed'];
// Valores conhecidos que REVOGAM acesso
const STATUS_REVOGA = ['refunded', 'refused', 'declined', 'chargedback', 'canceled', 'cancelled', 'expired', 'late'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (!KIWIFY_WEBHOOK_TOKEN || req.query.token !== KIWIFY_WEBHOOK_TOKEN) {
    console.warn('[webhook-kiwify] Token ausente ou inválido.');
    return res.status(401).json({ error: 'Token inválido.' });
  }

  const payload = req.body || {};
  console.log('[webhook-kiwify] Payload recebido:', JSON.stringify(payload));

  // A Kiwify envia os dados da venda dentro de um campo "order" - mas
  // mantemos também os caminhos antigos (nível raiz) como reserva, caso
  // algum evento venha em formato diferente.
  const order = payload.order || payload;

  const evento = String(
    order.order_status || payload.webhook_event_type || payload.event || ''
  ).toLowerCase();

  const email =
    order?.Customer?.email ||
    order?.customer?.email ||
    payload?.Customer?.email ||
    payload?.customer?.email ||
    payload?.email ||
    null;

  const nome =
    order?.Customer?.full_name ||
    order?.customer?.full_name ||
    order?.customer?.name ||
    payload?.Customer?.full_name ||
    'Assinante';

  const orderId = order?.order_id || order?.id || payload?.order_id || null;
  const plano =
    order?.Subscription?.plan?.name ||
    order?.subscription?.plan?.name ||
    order?.plan?.name ||
    'Assinatura';

  if (!email) {
    console.error('[webhook-kiwify] Não foi possível identificar o e-mail no payload recebido.');
    // Responde 200 mesmo assim para a Kiwify não ficar retentando um evento
    // que nunca vai ter e-mail (ex: eventos de carrinho abandonado sem e-mail).
    return res.status(200).json({ ok: true, aviso: 'e-mail não encontrado no payload' });
  }

  let novoStatus = null;
  if (STATUS_ATIVA.some((e) => evento.includes(e))) novoStatus = 'active';
  if (STATUS_REVOGA.some((e) => evento.includes(e))) novoStatus = 'inactive';

  if (!novoStatus) {
    console.log(`[webhook-kiwify] Evento "${evento}" não altera acesso; ignorado.`);
    return res.status(200).json({ ok: true });
  }

  try {
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        email,
        name: nome,
        status: novoStatus,
        plan: plano,
        kiwify_order_id: orderId,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!upsert.ok) {
      const errText = await upsert.text();
      console.error('[webhook-kiwify] Erro do Supabase:', errText);
      return res.status(502).json({ error: 'Falha ao atualizar o banco de assinantes.' });
    }

    // E-mail de boas-vindas ao ativar, com o link pra fazer login na área de membros
    if (novoStatus === 'active' && RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: 'Sua assinatura do Boletim PoliticaBR está ativa',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color:#0d253d;">Olá, ${nome}!</h2>
              <p>Sua assinatura foi confirmada com sucesso.</p>
              <p>Para acessar o Boletim personalizado, vá em
                <a href="${SITE_URL}/membros.html">${SITE_URL}/membros.html</a>
                e digite o e-mail que você usou na compra (<strong>${email}</strong>) —
                vamos te enviar um link de acesso direto.</p>
            </div>
          `,
        }),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[webhook-kiwify] Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno ao processar o webhook.' });
  }
}
