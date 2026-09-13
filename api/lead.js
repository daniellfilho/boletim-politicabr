/**
 * API Route (Vercel Serverless Function)
 * ----------------------------------------
 * Recebe os dados do formulário de captura de lead do quiz e envia um
 * e-mail de verdade para o leitor, usando o Resend (https://resend.com).
 *
 * Configuração necessária no painel da Vercel (Settings -> Environment
 * Variables) para este arquivo funcionar:
 *
 *   RESEND_API_KEY   -> sua chave de API do Resend (obrigatória)
 *   FROM_EMAIL       -> remetente verificado, ex:
 *                       "Boletim PoliticaBR <contato@seudominio.com.br>"
 *                       (opcional enquanto testa: sem essa variável, usa
 *                       o remetente de teste do Resend, que só consegue
 *                       enviar para o e-mail da SUA PRÓPRIA conta Resend)
 */
/**
 * API Route (Vercel Serverless Function)
 * ----------------------------------------
 * Recebe os dados do formulário de captura de lead do quiz, envia um
 * e-mail de confirmação (Resend), e grava o PERFIL POLÍTICO da pessoa
 * no Supabase - é esse registro que depois garante que, na área de
 * membros, cada assinante só veja o conteúdo do seu próprio grupo.
 *
 * Configuração necessária no painel da Vercel (Settings -> Environment
 * Variables) para este arquivo funcionar:
 *
 *   RESEND_API_KEY             -> sua chave de API do Resend (obrigatória)
 *   FROM_EMAIL                 -> remetente verificado
 *   SUPABASE_URL               -> ver robo/SUPABASE.md
 *   SUPABASE_SERVICE_ROLE_KEY  -> ver robo/SUPABASE.md
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mesma regra de corte usada no quiz (app.js) para decidir o "lado".
function calcularLado(score) {
  const s = Number(score);
  if (s >= 15) return 'direita';
  if (s <= -15) return 'esquerda';
  return 'centro';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { name, email, score, profile } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'Boletim PoliticaBR <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.error('[api/lead] RESEND_API_KEY não configurada nas variáveis de ambiente da Vercel.');
    return res.status(500).json({ error: 'Serviço de e-mail não configurado no servidor.' });
  }

  // Grava (ou atualiza) o perfil político da pessoa no Supabase.
  // Importante: NÃO enviamos o campo "status" aqui - assim, se a pessoa
  // já for assinante ativa, o status dela não é mexido; se for um cadastro
  // novo, ela entra com o status padrão da tabela ("inactive") até pagar.
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const lado = calcularLado(score);
    try {
      const upsert = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ email, name, perfil: lado }),
      });
      if (!upsert.ok) {
        console.error('[api/lead] Erro ao gravar perfil no Supabase:', await upsert.text());
      } else {
        console.log(`[api/lead] Perfil "${lado}" gravado para ${email}`);
      }
    } catch (err) {
      console.error('[api/lead] Erro inesperado ao gravar perfil:', err);
    }
  } else {
    console.warn('[api/lead] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configuradas - perfil não foi salvo.');
  }

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Seu acesso ao Boletim PoliticaBR está confirmado 🗳️',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="color:#0d253d;">Olá, ${name}!</h2>
            <p>Seu diagnóstico político foi concluído. Seu perfil identificado foi:</p>
            <p style="font-size: 18px; font-weight: bold; color:#0d253d;">${profile}</p>
            <p>Seu acesso à edição de lançamento do <strong>Boletim PoliticaBR</strong> está
            reservado com prioridade — em breve você receberá a primeira edição
            calibrada para o seu perfil.</p>
            <p style="margin-top:24px;font-size:12px;color:#888;">
              Você recebeu este e-mail porque preencheu o formulário de acesso
              no Boletim PoliticaBR. Pontuação registrada: ${score}.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      console.error('[api/lead] Erro retornado pelo Resend:', errorBody);
      return res.status(502).json({ error: 'Não foi possível enviar o e-mail agora.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/lead] Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno ao processar o envio.' });
  }
}
