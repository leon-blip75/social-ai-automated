import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  }).catch(() => null);
}

export async function POST(req: NextRequest) {
  try {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const received = req.headers.get('x-telegram-bot-api-secret-token');
    if (expected && received !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const update = await req.json();
    const callback = update.callback_query;
    if (!callback?.data) return NextResponse.json({ ok: true });

    const [action, postId] = String(callback.data).split(':');

    if (!postId) {
      await answerCallbackQuery(callback.id, 'Geen post ID gevonden.');
      return NextResponse.json({ ok: true, error: 'missing post id' });
    }

    await supabaseAdmin.from('approval_events').insert({ post_id: postId, action, payload: update });

    if (action === 'approve') {
      await supabaseAdmin.from('posts').update({ status: 'approved' }).eq('id', postId);
      await answerCallbackQuery(callback.id, 'Concept goedgekeurd. Social publishing koppelen we hierna.');
      return NextResponse.json({ ok: true, action, postId, status: 'approved' });
    }

    if (action === 'reject') {
      await supabaseAdmin.from('posts').update({ status: 'rejected' }).eq('id', postId);
      await answerCallbackQuery(callback.id, 'Concept afgekeurd.');
      return NextResponse.json({ ok: true, action, postId, status: 'rejected' });
    }

    if (action === 'regen') {
      await supabaseAdmin.from('posts').update({ status: 'draft' }).eq('id', postId);
      await answerCallbackQuery(callback.id, 'Regenerate gemarkeerd. Maak opnieuw via de app.');
      return NextResponse.json({ ok: true, action, postId, status: 'draft' });
    }

    await answerCallbackQuery(callback.id, 'Onbekende actie.');
    return NextResponse.json({ ok: true, ignored: true, action, postId });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 200 });
  }
}
