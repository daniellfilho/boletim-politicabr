/**
 * Recebe um e-mail digitado no formulário de login da área de membros.
 * Se esse e-mail estiver marcado como assinante ATIVO no Supabase, envia
 * um e-mail com um link de acesso válido por 15 minutos.
 *
 * Por segurança, a resposta é sempre a mesma independente do e-mail
 * existir ou não na base — isso evita que alguém use este formulário
 * para "adivinhar" quais e-mails são assinantes.
 */
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Boletim PoliticaBR <onboarding@resend.dev>';
const SITE_URL = process.env.SITE_URL || '';

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Informe um e-mail.' });
  }

  try {
    const lookup = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}&select=status,name`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const rows = await lookup.json();
    const ativo = rows?.[0]?.status === 'active';

    if (ativo && SESSION_SECRET) {
      const expira = Date.now() + 15 * 60 * 1000; // link válido por 15 minutos
      const payloadBase = `${email}:${expira}`;
      const assinatura = sign(payloadBase);
      const token = Buffer.from(`${payloadBase}:${assinatura}`).toString('base64url');
      const link = `${SITE_URL}/api/verify-access?token=${token}`;

      if (RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            subject: 'Seu link de acesso ao Boletim PoliticaBR',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <p>Clique no botão abaixo para acessar sua edição personalizada
                (o link é válido por 15 minutos):</p>
                <p><a href="${link}" style="display:inline-block;background:#ffbf00;color:#0d253d;
                  padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                  Acessar o Boletim
                </a></p>
                <p style="font-size:12px;color:#888;">Se você não pediu este acesso, ignore este e-mail.</p>
              </div>
            `,
          }),
        });
      }
    }

    // Mesma resposta, ativo ou não - não revela se o e-mail existe na base.
    return res.status(200).json({
      ok: true,
      message: 'Se este e-mail tiver uma assinatura ativa, enviamos um link de acesso agora.',
    });
  } catch (err) {
    console.error('[request-access] Erro:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
