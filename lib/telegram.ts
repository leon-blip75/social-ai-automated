const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_ALLOWED_CHAT_ID;

function cut(text: string, max = 140) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 3).trim() + '...';
}

function findPost(posts: any[], platform: string) {
  return posts.find((p) => String(p.platform).toLowerCase() === platform) || null;
}

function cleanTopic(topic: string) {
  return String(topic || '')
    .split(/[\n,;|]+/)
    .map((part) => part.trim())
    .filter(Boolean)[0] || 'Slimmer werken met AI';
}

function buildIdeaCaption(payload: { brand: any; idea: any; posts: any[] }) {
  const linkedin = findPost(payload.posts, 'linkedin');
  const facebook = findPost(payload.posts, 'facebook');
  const instagram = findPost(payload.posts, 'instagram');
  const topic = cleanTopic(payload.idea.topic);

  return [
    `${payload.brand.name} social voorstel`,
    ``,
    `Onderwerp: ${topic}`,
    ``,
    `LinkedIn: ${cut(linkedin?.caption || '-')}`,
    ``,
    `Facebook: ${cut(facebook?.caption || '-')}`,
    ``,
    `Instagram: ${cut(instagram?.caption || '-')}`,
    ``,
    `1x goedkeuren = alle 3 opslaan als approved.`
  ].join('\n').slice(0, 900);
}

function fallbackImageUrl(brandName: string, topic: string) {
  const shortTopic = cleanTopic(topic).slice(0, 50);
  const title = encodeURIComponent(`${brandName || 'Nixos'}\n${shortTopic}`);
  return `https://placehold.co/1024x1024/0f172a/e2e8f0/png?text=${title}`;
}

async function sendMessageWithMarkup(text: string, reply_markup?: any) {
  if (!token || !chatId) return;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup })
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sendPhotoByUrl(imageUrl: string, caption: string, reply_markup: any) {
  if (!token || !chatId) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption, reply_markup })
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sendPhotoUpload(imageUrl: string, caption: string, reply_markup: any) {
  if (!token || !chatId) return null;

  const imageRes = await fetch(imageUrl, { cache: 'no-store' });
  if (!imageRes.ok) throw new Error(`Image fetch failed: ${imageRes.status}`);

  const contentType = imageRes.headers.get('content-type') || '';
  const bytes = await imageRes.arrayBuffer();
  const head = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.byteLength, 200))).trim();

  if (!contentType.startsWith('image/') || head.startsWith('{') || head.startsWith('[') || head.includes('Queue full')) {
    throw new Error('Image provider returned non-image content');
  }

  const blob = new Blob([bytes], { type: contentType || 'image/jpeg' });
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('photo', blob, 'social-image.jpg');
  form.append('caption', caption);
  form.append('reply_markup', JSON.stringify(reply_markup));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: form
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendTelegramMessage(text: string) {
  return sendMessageWithMarkup(text);
}

export async function sendTelegramIdeaApproval(payload: {
  brand: any;
  idea: any;
  posts: any[];
}) {
  if (!token || !chatId) return;

  const caption = buildIdeaCaption(payload);
  const fallback = fallbackImageUrl(payload.brand.name, payload.idea.topic);
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
    try {
      return await sendPhotoUpload(payload.idea.image_url, caption, reply_markup);
    } catch (error) {
      try {
        return await sendPhotoByUrl(fallback, caption, reply_markup);
      } catch (fallbackError) {
        return sendMessageWithMarkup(`${caption}\n\nAI-afbeelding kon nu niet worden opgehaald.`, reply_markup);
      }
    }
  }

  try {
    return await sendPhotoByUrl(fallback, caption, reply_markup);
  } catch (error) {
    return sendMessageWithMarkup(caption, reply_markup);
  }
}
