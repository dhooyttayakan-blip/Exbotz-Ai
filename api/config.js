// ⚡ EXBOTZ AI — /api/config.js
// Kirim config Supabase ke frontend (aman)
// Key rahasia (GROQ, GEMINI) tidak dikirim ke frontend!

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  return res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    // GROQ_KEY, GEMINI_KEY, OPENROUTER_KEY TIDAK dikirim ke frontend
    // Key tersebut hanya dipakai di api/chat.js (server side)
  });
}
