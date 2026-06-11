const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_ALLOWED_CHAT_ID;

function cut(text: string, max = 220) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '…';
}

function findPost(posts: any[], platform: string) {
  return posts.find((p) => String(p.platform).toLowerCase() === platform) || null;
}

function buildIdeaCaption(payload: { brand: any; idea: any; posts: any[] }) {
  const linkedin = findPost(payload.posts, 'linkedin');
  const facebook = findPost(payload.posts, 'facebook');
  const instagram = findPost(payload.posts, 'instagram');

  const text = [
    `Nieuw social voorstel voor ${payload.brand.name}`,
    ``,
    `Onderwerp: ${payload.idea.topic}`,
    ``,
    `LinkedIn:`,
    cut(linkedin?.caption || '-', 220),
    ``,
    `Facebook:`,
    cut(facebook?.caption || '-', 220),
    ``,
    `Instagram:`,
    cut(instagram?.caption || '-', 220)
  ].join('\n');

  return text.slice(0, 1024);
}

export async function sendTelegramMessage(text: string) {
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  }).catch(() => null);
}

export async function sendTelegramIdeaApproval(payload: {
  brand: any;
  idea: any;
  posts: any[];
}) {
  if (!token || !chatId) return;

  const caption = buildIdeaCaption(payload);
  const reply_markup = {
    inline_keyboard: [
      [
        { text: 'Approve all', callback_data: `approve_idea:${payload.idea.id}` },
        { text: 'Reject all', callback_data: `reject_idea:${payload.idea.id}` }
      ],
      [
        { text: 'Regenerate', callback_data: `regen_idea:${payload.idea.id}` }
      ]
    ]
  };

  if (payload.idea.image_url) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: payload.idea.image_url,
        caption,
        reply_markup
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: caption, reply_markup })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
