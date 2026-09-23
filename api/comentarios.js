/**
 * API Route (Vercel Serverless Function)
 * ----------------------------------------
 * Comunidade do Boletim PoliticaBR - comentários em cada notícia e posts
 * no mural geral, disponíveis só para assinantes ATIVOS (mesma sessão
 * de cookie criada em verify-access.js / conferida em check-session.js).
 *
 * GET  /api/comentarios?noticia_id=AAAA-MM-DD-N  -> comentários de UMA notícia
 * GET  /api/comentarios                          -> posts do mural geral
 * POST /api/comentarios                          -> cria comentário/post
 *   body: { texto: string, noticia_id?: string }
 *
 * Variáveis de ambiente necessárias (já configuradas na Vercel):
 *   SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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

// Confere o cookie de sessão e, se válido, confirma no Supabase que a
// assinatura CONTINUA ativa agora - devolve {email, nome, perfil} ou null.
// É a mesma lógica de check-session.js, repetida aqui porque cada função
// da Vercel roda isolada (sem módulos compartilhados neste projeto).
async function getAssinanteAutenticado(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.boletim_session;
  if (!token) return null;

  let email;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    let expira, assinatura;
    [email, expira, assinatura] = decoded.split(':');
    const esperado = sign(`${email}:${expira}`);
    if (esperado !== assinatura || Date.now() > Number(expira)) return null;
  } catch {
    return null;
  }

  try {
    const lookup = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}&select=name,status,perfil`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const rows = await lookup.json();
    const registro = rows?.[0];
    if (!registro || registro.status !== 'active') return null;
    return {
      email,
      nome: registro.name || email.split('@')[0],
      perfil: registro.perfil || null,
    };
  } catch (err) {
    console.error('[comentarios] Erro ao validar assinante:', err);
    return null;
  }
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SESSION_SECRET) {
    console.error('[comentarios] Variáveis de ambiente ausentes.');
    return res.status(500).json({ error: 'Serviço indisponível no momento.' });
  }

  // A Comunidade é só para assinantes ativos - vale tanto para ler quanto
  // para publicar, então a checagem de sessão vem antes de tudo.
  const assinante = await getAssinanteAutenticado(req);
  if (!assinante) {
    return res.status(401).json({ error: 'É preciso ser assinante para acessar a Comunidade.' });
  }

  if (req.method === 'GET') {
    const noticiaId = typeof req.query.noticia_id === 'string' && req.query.noticia_id.trim()
      ? req.query.noticia_id.trim()
      : null;

    const filtro = noticiaId
      ? `noticia_id=eq.${encodeURIComponent(noticiaId)}&order=created_at.asc`
      : `noticia_id=is.null&order=created_at.desc`;

    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/comentarios?select=nome,lado,texto,created_at&${filtro}&limit=200`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (!resp.ok) {
        console.error('[comentarios] Erro do Supabase (GET):', await resp.text());
        return res.status(502).json({ error: 'Não foi possível carregar os comentários.' });
      }
      const dados = await resp.json();
      return res.status(200).json({ comentarios: Array.isArray(dados) ? dados : [] });
    } catch (err) {
      console.error('[comentarios] Erro inesperado (GET):', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  if (req.method === 'POST') {
    const { texto, noticia_id } = req.body || {};
    const textoLimpo = typeof texto === 'string' ? texto.trim() : '';

    if (!textoLimpo) {
      return res.status(400).json({ error: 'Escreva algo antes de publicar.' });
    }
    if (textoLimpo.length > 500) {
      return res.status(400).json({ error: 'Comentário muito longo (máximo de 500 caracteres).' });
    }

    const noticiaIdLimpo = typeof noticia_id === 'string' && noticia_id.trim()
      ? noticia_id.trim().slice(0, 60)
      : null;

    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          email: assinante.email,
          nome: assinante.nome,
          lado: assinante.perfil,
          noticia_id: noticiaIdLimpo,
          texto: textoLimpo,
        }),
      });

      if (!resp.ok) {
        console.error('[comentarios] Erro do Supabase (POST):', await resp.text());
        return res.status(502).json({ error: 'Não foi possível publicar o comentário.' });
      }

      const [novo] = await resp.json();
      return res.status(200).json({ ok: true, comentario: novo });
    } catch (err) {
      console.error('[comentarios] Erro inesperado (POST):', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
