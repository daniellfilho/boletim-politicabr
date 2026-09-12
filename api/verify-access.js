/**
 * Valida o token do "magic link" enviado por e-mail (ver request-access.js).
 * Se válido, cria um cookie de sessão de 30 dias e redireciona para a
 * área de membros.
 */
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET;

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Link inválido: token ausente.');
  }

  let email, expira, assinatura;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    [email, expira, assinatura] = decoded.split(':');
  } catch {
    return res.status(400).send('Link inválido.');
  }

  const esperado = sign(`${email}:${expira}`);
  if (!email || esperado !== assinatura || Date.now() > Number(expira)) {
    return res.status(401).send(
      'Este link expirou ou é inválido. Volte para a área de membros e peça um novo acesso.'
    );
  }

  // Sessão válida por 30 dias
  const sessaoExpira = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const sessaoPayload = `${email}:${sessaoExpira}`;
  const sessaoAssinatura = sign(sessaoPayload);
  const sessaoToken = Buffer.from(`${sessaoPayload}:${sessaoAssinatura}`).toString('base64url');

  res.setHeader(
    'Set-Cookie',
    `boletim_session=${sessaoToken}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Lax`
  );
  res.writeHead(302, { Location: '/membros.html' });
  res.end();
}
