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
