/**
 * API Route (Vercel Serverless Function)
 * ----------------------------------------
 * Registra um voto ANÔNIMO da urna interativa do site. Não recebe nem
 * grava nenhum dado pessoal (nome, e-mail, IP) - apenas o número
 * escolhido e o horário, para compor o "Resultado da Urna" em tempo real.
 *
 * Variáveis de ambiente necessárias (já configuradas na Vercel):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { numero } = req.body || {};
  if (!numero || typeof numero !== 'string' || numero.length > 10) {
    return res.status(400).json({ error: 'Número de voto inválido.' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[registrar-voto] Supabase não configurado.');
    return res.status(500).json({ error: 'Serviço indisponível no momento.' });
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/votos_urna`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ numero }),
    });

    if (!resp.ok) {
      console.error('[registrar-voto] Erro do Supabase:', await resp.text());
      return res.status(502).json({ error: 'Não foi possível registrar o voto.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[registrar-voto] Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
