// netlify/functions/professionals.js
//
// Proxy entre o RESOLVE (frontend) e o Airtable.
// O token do Airtable NUNCA fica no navegador — ele mora aqui,
// lido de variáveis de ambiente configuradas no painel da Netlify
// (Site settings → Environment variables):
//
//   AIRTABLE_BASE_ID   -> appXTSovA3ayU48bB
//   AIRTABLE_TABLE     -> Profissionais
//   AIRTABLE_TOKEN     -> pat... (seu Personal Access Token)
//
// O frontend só conhece o endereço desta função (/.netlify/functions/professionals),
// nunca o token.

exports.handler = async (event) => {
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE = process.env.AIRTABLE_TABLE || 'Profissionais';
  const TOKEN = process.env.AIRTABLE_TOKEN;

  if (!BASE_ID || !TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'Airtable não configurado no servidor (variáveis de ambiente ausentes).' } }),
    };
  }

  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const recordId = params.id || '';
  const qs = params.qs || '';

  let url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
  if (recordId) url += `/${encodeURIComponent(recordId)}`;
  if (method === 'GET' && qs) url += `?${qs}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: (method === 'POST' || method === 'PATCH') ? event.body : undefined,
    });

    const text = await res.text();

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: { message: 'Falha ao falar com o Airtable: ' + String(err) } }),
    };
  }
};
