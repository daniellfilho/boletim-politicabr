/**
 * API Route (Vercel Serverless Function)
 * ----------------------------------------
 * Devolve a contagem REAL e agregada de votos da urna (de todos os
 * visitantes do site, não só de um navegador), para exibir o
 * "Resultado da Urna" em tempo real. Endpoint público, sem dado pessoal.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Serviço indisponível no momento.' });
  }

  try {
    // Chama a função SQL resultado_urna() (ver robo/SUPABASE.md), que já
    // devolve os votos agrupados e somados por número.
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resultado_urna`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!resp.ok) {
      console.error('[resultado-urna] Erro do Supabase:', await resp.text());
      return res.status(502).json({ error: 'Não foi possível buscar o resultado.' });
    }

    const linhas = await resp.json();
    const tally = {};
    linhas.forEach((linha) => {
      tally[linha.numero] = Number(linha.total) || 0;
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ tally });
  } catch (err) {
    console.error('[resultado-urna] Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
