/**
 * Lê o cookie de sessão (criado em verify-access.js) e confirma se ainda
 * é válido. Além disso, consulta o Supabase para trazer o PERFIL político
 * da pessoa e confirmar que a assinatura CONTINUA ativa agora (não só no
 * momento em que o link de acesso foi enviado) - assim, se alguém cancelar
 * a assinatura, o acesso é cortado mesmo com o cookie ainda "válido".
 *
 * Usada pela página membros.html assim que ela carrega.
 */
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.boletim_session;

  if (!token) {
    return res.status(200).json({ authenticated: false });
  }

  let email;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    let expira, assinatura;
    [email, expira, assinatura] = decoded.split(':');
    const esperado = sign(`${email}:${expira}`);

    if (esperado !== assinatura || Date.now() > Number(expira)) {
      return res.status(200).json({ authenticated: false });
    }
  } catch {
    return res.status(200).json({ authenticated: false });
  }

  // Cookie válido - agora confirma no banco se a assinatura CONTINUA ativa
  // e busca o perfil político da pessoa.
  try {
    const lookup = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}&select=status,perfil`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const rows = await lookup.json();
    const registro = rows?.[0];

    if (!registro || registro.status !== 'active') {
      return res.status(200).json({ authenticated: false, motivo: 'assinatura_inativa' });
    }

    return res.status(200).json({ authenticated: true, email, perfil: registro.perfil || null });
  } catch (err) {
    console.error('[check-session] Erro ao consultar Supabase:', err);
    return res.status(200).json({ authenticated: false });
  }
}
