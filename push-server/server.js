const express = require('express');
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://krqlbdpuuamimbllddtj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_DWDJXwLW4zXqeApYiZOLGA_yt9pJj1e';
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || 'BJTs92Dy1WoUpGHN_evm-CxoTF72VFYPw4icitZZ8xzAZ95qO-lxZhBOD4_umq-5c81VXvCX4GagbSDoT8AVE0Y';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'wNPzospRbg40aw0mr8_TriAwLg3RP58ZIAiHLFP0qm8';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

webpush.setVapidDetails(
  'mailto:contato@secretariadebolso.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

app.post('/send-push', async (req, res) => {
  const {
    title = 'Secretária de Bolso',
    body = '',
    icon = '/icon-192.png',
    badge = '/icon-512.png',
    requireInteraction = true,
    url = 'https://app.secretariadebolso.com'
  } = req.body;

  const { data: subs, error } = await sb.from('push_subscriptions').select('*');
  if (error) return res.status(500).json({ error: error.message });
  if (!subs || !subs.length) return res.json({ sent: 0, failed: 0 });

  const payload = JSON.stringify({ title, body, icon, badge, requireInteraction, url });

  let sent = 0;
  let failed = 0;

  await Promise.all(subs.map(async (s) => {
    try {
      const sub = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (e) {
      failed++;
      if (e.statusCode === 410 || e.statusCode === 404) {
        await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    }
  }));

  res.json({ sent, failed });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Push server na porta ${PORT}`));
