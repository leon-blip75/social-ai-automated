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

function fallbackImageUrl(topic: string) {
  const t = cleanTopic(topic).toLowerCase();
  const day = Math.floor(Date.now() / 86400000);

  const groups: Record<string, string[]> = {
    dashboard: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1024&h=1024&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1024&h=1024&q=80'
    ],
    entrepreneur: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1024&h=1024&q=80',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1024&h=1024&q=80'
    ],
    automation: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1024&h=1024&q=80',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1024&h=1024&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1024&h=1024&q=80'
    ],
    workflow: [
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1024&h=1024&q=80',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1024&h=1024&q=80'
    ]
  };

  let list = groups.workflow;
  if (t.includes('dashboard') || t.includes('data')) list = groups.dashboard;
  else if (t.includes('ondernemer') || t.includes('ondernemers') || t.includes('tip')) list = groups.entrepreneur;
  else if (t.includes('ai') || t.includes('proces') || t.includes('workflow') || t.includes('automatis')) list = groups.automation;

  return list[day % list.length];
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
  const fallback = fallbackImageUrl(payload.idea.topic);
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
        return await sendPhotoUpload(fallback, caption, reply_markup);
      } catch (fallbackError) {
        try {
          return await sendPhotoByUrl(fallback, caption, reply_markup);
        } catch (fallbackUrlError) {
          return sendMessageWithMarkup(`${caption}\n\nAI-afbeelding kon nu niet worden opgehaald.`, reply_markup);
        }
      }
    }
  }

  try {
    return await sendPhotoUpload(fallback, caption, reply_markup);
  } catch (error) {
    try {
      return await sendPhotoByUrl(fallback, caption, reply_markup);
    } catch (fallbackError) {
      return sendMessageWithMarkup(caption, reply_markup);
    }
  }
}
