import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
}

export async function POST(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = req.headers.get('x-telegram-bot-api-secret-token');
  if (expected && received !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const update = await req.json();
  const callback = update.callback_query;
  if (!callback?.data) return NextResponse.json({ ok: true });

  const [action, postId] = String(callback.data).split(':');
  await supabaseAdmin.from('approval_events').insert({ post_id: postId, action, payload: update });

  if (action === 'approve') {
    await supabaseAdmin.from('posts').update({ status: 'approved' }).eq('id', postId);
    const publishRes = await fetch(`${process.env.APP_URL}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId })
    });
    await answerCallbackQuery(callback.id, publishRes.ok ? 'Goedgekeurd en publicatie gestart.' : 'Goedgekeurd, maar publiceren mislukte. Check logs.');
  }

  if (action === 'reject') {
    await supabaseAdmin.from('posts').update({ status: 'rejected' }).eq('id', postId);
    await answerCallbackQuery(callback.id, 'Concept afgekeurd.');
  }

  if (action === 'regen') {
    await supabaseAdmin.from('posts').update({ status: 'draft' }).eq('id', postId);
    await answerCallbackQuery(callback.id, 'Regenerate gemarkeerd. Maak opnieuw via de app.');
  }

  return NextResponse.json({ ok: true });
}
