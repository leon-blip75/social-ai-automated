import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createAndSendBatchConcept } from '@/lib/generation';
import { publishPost } from '@/lib/publishers';

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: true })
  }).catch(() => null);
}

async function sendTelegramMessage(chatId: number | string | undefined, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  }).catch(() => null);
}

async function publishApprovedIdeaPosts(ideaId: string) {
  const { data: posts, error: postsError } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('idea_id', ideaId)
    .order('platform');

  if (postsError) throw postsError;

  const results: { platform: string; ok: boolean; message: string }[] = [];

  for (const post of posts || []) {
    const { data: account } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('brand_id', post.brand_id)
      .eq('platform', post.platform)
      .eq('enabled', true)
      .maybeSingle();

    if (!account) {
      await supabaseAdmin
        .from('posts')
        .update({ status: 'approved', error: `No enabled ${post.platform} account connected` })
        .eq('id', post.id);

      results.push({ platform: post.platform, ok: false, message: 'nog niet gekoppeld' });
      continue;
    }

    try {
      const result = await publishPost({
        platform: post.platform,
        caption: post.caption,
        imageUrl: post.image_url,
        account
      });

      await supabaseAdmin
        .from('posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          external_post_id: result.external_post_id || result.id || null,
          error: null
        })
        .eq('id', post.id);

      results.push({ platform: post.platform, ok: true, message: 'gepubliceerd' });
    } catch (error: any) {
      await supabaseAdmin
        .from('posts')
        .update({ status: 'failed', error: error?.message || String(error) })
        .eq('id', post.id);

      results.push({ platform: post.platform, ok: false, message: 'publicatie mislukt' });
    }
  }

  const allPublished = results.length > 0 && results.every((r) => r.ok);
  await supabaseAdmin
    .from('post_ideas')
    .update({ status: allPublished ? 'published' : 'approved' })
    .eq('id', ideaId);

  return results;
}

function formatPublishResults(results: { platform: string; ok: boolean; message: string }[]) {
  if (!results.length) return 'Geen posts gevonden om te publiceren.';
  return results
    .map((r) => `${r.ok ? '✅' : '⚠️'} ${r.platform}: ${r.message}`)
    .join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const received = req.headers.get('x-telegram-bot-api-secret-token');
    if (expected && received !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const update = await req.json();
    const callback = update.callback_query;
    if (!callback?.data) return NextResponse.json({ ok: true });

    const [action, id] = String(callback.data).split(':');
    const chatId = callback?.message?.chat?.id;

    if (!id) {
      await answerCallbackQuery(callback.id, 'Geen ID gevonden.');
      await sendTelegramMessage(chatId, 'Geen ID gevonden.');
      return NextResponse.json({ ok: true, error: 'missing id' });
    }

    if (action === 'approve_idea') {
      await supabaseAdmin.from('post_ideas').update({ status: 'approved' }).eq('id', id);
      await supabaseAdmin.from('posts').update({ status: 'approved', error: null }).eq('idea_id', id);

      await answerCallbackQuery(callback.id, 'Goedgekeurd. Ik probeer nu te publiceren...');

      const results = await publishApprovedIdeaPosts(id);
      const message = `Concept goedgekeurd.\n\nPublicatie-resultaat:\n${formatPublishResults(results)}`;
      await sendTelegramMessage(chatId, message);
      return NextResponse.json({ ok: true, action, ideaId: id, results });
    }

    if (action === 'reject_idea') {
      await supabaseAdmin.from('post_ideas').update({ status: 'rejected' }).eq('id', id);
      await supabaseAdmin.from('posts').update({ status: 'rejected' }).eq('idea_id', id);
      const message = 'Concept afgekeurd voor alle 3 platformen.';
      await answerCallbackQuery(callback.id, message);
      await sendTelegramMessage(chatId, message);
      return NextResponse.json({ ok: true, action, ideaId: id, status: 'rejected' });
    }

    if (action === 'regen_idea') {
      const { data: idea, error: ideaError } = await supabaseAdmin
        .from('post_ideas')
        .select('*, brands(*)')
        .eq('id', id)
        .single();

      if (ideaError || !idea) {
        const message = 'Concept niet gevonden voor regenerate.';
        await answerCallbackQuery(callback.id, message);
        await sendTelegramMessage(chatId, message);
        return NextResponse.json({ ok: true, error: 'idea not found' });
      }

      const { data: posts } = await supabaseAdmin.from('posts').select('*').eq('idea_id', id);
      const platforms = Array.from(new Set((posts || []).map((p: any) => String(p.platform).toLowerCase())));

      await supabaseAdmin.from('post_ideas').update({ status: 'rejected' }).eq('id', id);
      await supabaseAdmin.from('posts').update({ status: 'rejected' }).eq('idea_id', id);

      const result = await createAndSendBatchConcept({
        brand: idea.brands,
        topic: idea.topic,
        platforms: platforms.length ? platforms : ['linkedin', 'facebook', 'instagram'],
        scheduleId: idea.schedule_id || null
      });

      const message = `Nieuwe variant gemaakt voor: ${idea.topic}`;
      await answerCallbackQuery(callback.id, message);
      await sendTelegramMessage(chatId, message);
      return NextResponse.json({ ok: true, action, oldIdeaId: id, newIdeaId: result.idea.id });
    }

    await supabaseAdmin.from('approval_events').insert({ post_id: id, action, payload: update });

    if (action === 'approve') {
      await supabaseAdmin.from('posts').update({ status: 'approved' }).eq('id', id);
      const message = 'Concept goedgekeurd en opgeslagen als approved.';
      await answerCallbackQuery(callback.id, message);
      await sendTelegramMessage(chatId, message);
      return NextResponse.json({ ok: true, action, postId: id, status: 'approved' });
    }

    if (action === 'reject') {
      await supabaseAdmin.from('posts').update({ status: 'rejected' }).eq('id', id);
      const message = 'Concept afgekeurd en opgeslagen als rejected.';
      await answerCallbackQuery(callback.id, message);
      await sendTelegramMessage(chatId, message);
      return NextResponse.json({ ok: true, action, postId: id, status: 'rejected' });
    }

    if (action === 'regen') {
      await supabaseAdmin.from('posts').update({ status: 'draft' }).eq('id', id);
      const message = 'Regenerate gemarkeerd. Maak opnieuw een concept via de app.';
      await answerCallbackQuery(callback.id, message);
      await sendTelegramMessage(chatId, message);
      return NextResponse.json({ ok: true, action, postId: id, status: 'draft' });
    }

    await answerCallbackQuery(callback.id, 'Onbekende actie.');
    await sendTelegramMessage(chatId, 'Onbekende actie ontvangen.');
    return NextResponse.json({ ok: true, ignored: true, action, id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 200 });
  }
}
