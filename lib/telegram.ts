export async function sendTelegramApproval(input: {
  postId: string;
  caption: string;
  platform: string;
  imageUrl?: string | null;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_ALLOWED_CHAT_ID!;
  const text = `Nieuw social concept\n\nPlatform: ${input.platform}\n\n${input.caption}`;
  const reply_markup = {
    inline_keyboard: [[
      { text: '✅ Approve & post', callback_data: `approve:${input.postId}` },
      { text: '❌ Reject', callback_data: `reject:${input.postId}` },
      { text: '🔁 Regenerate', callback_data: `regen:${input.postId}` }
    ]]
  };

  const endpoint = input.imageUrl ? 'sendPhoto' : 'sendMessage';
  const body: any = input.imageUrl
    ? { chat_id: chatId, photo: input.imageUrl, caption: text.slice(0, 1024), reply_markup }
    : { chat_id: chatId, text, reply_markup };

  const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
