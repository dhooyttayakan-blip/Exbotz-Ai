// ⚡ EXBOTZ AI — /api/chat.js
// File ini berjalan di Vercel (server)
// Key API tersimpan aman di Vercel Environment Variables
// Tidak ada key yang terlihat di GitHub!

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system, model } = req.body;
  if (!messages || !system) return res.status(400).json({ error: 'Missing messages or system' });

  const selectedModel = model || 'llama-3.3-70b-versatile';

  // ── COBA GROQ DULU ──
  const GROQ_KEY = process.env.GROQ_KEY;
  if (GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GROQ_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 1500,
          messages: [{ role: 'system', content: system }, ...messages]
        })
      });
      const data = await r.json();
      if (data.choices?.[0]?.message?.content) {
        return res.status(200).json({ ...data, _engine: 'groq' });
      }
    } catch (e) {
      console.error('Groq error:', e.message);
    }
  }

  // ── FALLBACK: GEMINI ──
  const GEMINI_KEY = process.env.GEMINI_KEY;
  if (GEMINI_KEY) {
    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: history,
            generationConfig: { maxOutputTokens: 1500 }
          })
        }
      );
      const data = await r.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Konversi ke format OpenAI agar mudah diproses di frontend
        return res.status(200).json({
          choices: [{ message: { content: data.candidates[0].content.parts[0].text } }],
          _engine: 'gemini'
        });
      }
    } catch (e) {
      console.error('Gemini error:', e.message);
    }
  }

  // ── FALLBACK: OPENROUTER ──
  const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
  if (OPENROUTER_KEY) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + OPENROUTER_KEY,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://exbotz.vercel.app',
          'X-Title': 'Exbotz AI'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          max_tokens: 1500,
          messages: [{ role: 'system', content: system }, ...messages]
        })
      });
      const data = await r.json();
      if (data.choices?.[0]?.message?.content) {
        return res.status(200).json({ ...data, _engine: 'openrouter' });
      }
    } catch (e) {
      console.error('OpenRouter error:', e.message);
    }
  }

  // Semua gagal
  return res.status(503).json({ error: 'Semua AI engine tidak tersedia. Cek API key di Vercel.' });
}
