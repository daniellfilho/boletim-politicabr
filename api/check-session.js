/**
 * Lê o cookie de sessão (criado em verify-access.js) e confirma se ainda
 * é válido. Usada pela página membros.html assim que ela carrega, para
 * decidir se mostra o formulário de login ou o conteúdo do assinante.
 */
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET;

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

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [email, expira, assinatura] = decoded.split(':');
    const esperado = sign(`${email}:${expira}`);

    if (esperado !== assinatura || Date.now() > Number(expira)) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({ authenticated: true, email });
  } catch {
    return res.status(200).json({ authenticated: false });
  }
}
