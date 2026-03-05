// ⚡ EXBOTZ AI — /api/auth.js
// Handle login, register, update user data
// Supabase keys aman di Vercel Environment Variables

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Mode demo - tidak ada Supabase
    return res.status(200).json({ demo: true, tokens: 50, level: 1, exp: 0, is_premium: false, is_admin: false });
  }

  const { action } = req.body;

  // ── LOGIN ──
  if (action === 'login') {
    const { email, password } = req.body;
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const authData = await r.json();
      if (authData.error) return res.status(400).json({ error: authData.error_description || authData.error });

      // Ambil profile user
      const uid = authData.user?.id;
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + authData.access_token }
      });
      const profiles = await profileRes.json();
      const profile = profiles?.[0] || {};

      // Buat profile jika belum ada
      if (!profiles?.length) {
        await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + authData.access_token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: uid, email, name: email.split('@')[0].toUpperCase(), tokens: 50, level: 1, exp: 0, is_premium: false, is_admin: false })
        });
      }

      return res.status(200).json({
        access_token: authData.access_token,
        id: uid,
        email,
        name: profile.name || email.split('@')[0].toUpperCase(),
        tokens: profile.tokens ?? 50,
        level: profile.level ?? 1,
        exp: profile.exp ?? 0,
        is_premium: profile.is_premium ?? false,
        is_admin: profile.is_admin ?? false
      });
    } catch (e) {
      return res.status(500).json({ error: 'Login error: ' + e.message });
    }
  }

  // ── REGISTER ──
  if (action === 'register') {
    const { email, password, name } = req.body;
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (data.error) return res.status(400).json({ error: data.error_description || data.error });

      const uid = data.user?.id;
      if (uid) {
        await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: uid, email, name: (name || email.split('@')[0]).toUpperCase(), tokens: 50, level: 1, exp: 0, is_premium: false, is_admin: false })
        });
      }

      return res.status(200).json({ id: uid, email, name: (name || email.split('@')[0]).toUpperCase(), tokens: 50 });
    } catch (e) {
      return res.status(500).json({ error: 'Register error: ' + e.message });
    }
  }

  // ── UPDATE USER DATA ──
  if (action === 'update') {
    const { id, tokens, level, exp, is_premium, token } = req.body;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + (token || SUPABASE_KEY), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, level, exp, is_premium })
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── SAVE CHAT ──
  if (action === 'saveChat') {
    const { user_id, question, answer, token } = req.body;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/chats`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + (token || SUPABASE_KEY), 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, question, answer, created_at: new Date().toISOString() })
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
