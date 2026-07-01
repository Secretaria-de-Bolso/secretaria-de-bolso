const express = require('express');
const webpush = require('web-push');

const app = express();
app.use(express.json());

const SUPABASE_URL = 'https://krqlbdpuuamimbllddtj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DWDJXwLW4zXqeApYiZOLGA_yt9pJj1e';
const VAPID_PUBLIC  = 'BJTs92Dy1WoUpGHN_evm-CxoTF72VFYPw4icitZZ8xzAZ95qO-lxZhBOD4_umq-5c81VXvCX4GagbSDoT8AVE0Y';
const VAPID_PRIVATE = 'wNPzospRbg40aw0mr8_TriAwLg3RP58ZIAiHLFP0qm8';

webpush.setVapidDetails('mailto:contato@secretariadebolso.com', VAPID_PUBLIC, VAPID_PRIVATE);

const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function getSubscriptions() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`Supabase GET error: ${res.status}`);
  return res.json();
}

async function deleteSubscription(endpoint) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: 'DELETE', headers: SB_HEADERS }
  );
}

app.post('/send-push', async (req, res) => {
  try {
    const {
      title = 'Secretária de Bolso',
      body = '',
      icon = 'https://app.secretariadebolso.com/sb-nova.png',
      requireInteraction = true,
      url = 'https://app.secretariadebolso.com',
      user_id
    } = req.body || {};

    let subs = await getSubscriptions();
    if (user_id) subs = subs.filter((s) => s.user_id === user_id);
    if (!subs.length) return res.json({ sent: 0, failed: 0 });

    const payload = JSON.stringify({ title, body, icon, requireInteraction, url });
    let sent = 0, failed = 0;

    await Promise.all(subs.map(async (s) => {
      const sub = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
      let lastErr;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await webpush.sendNotification(sub, payload);
          console.log(`[push] OK user=${s.user_id} status=${result.statusCode}`);
          sent++;
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (lastErr) {
        console.log(`[push] FAIL user=${s.user_id} status=${lastErr.statusCode} body=${lastErr.body}`);
        failed++;
        if (lastErr.statusCode === 410 || lastErr.statusCode === 404) await deleteSubscription(s.endpoint);
      }
    }));

    res.json({ sent, failed });
  } catch (e) {
    console.error('[push] ERROR', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, '0.0.0.0', () => console.log('Push server na porta 3001'));
