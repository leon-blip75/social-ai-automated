import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { publishPost } from '@/lib/publishers';

export async function POST(req: NextRequest) {
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 });

  const { data: post, error: postError } = await supabaseAdmin.from('posts').select('*').eq('id', postId).single();
  if (postError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const { data: account, error: accountError } = await supabaseAdmin
    .from('social_accounts')
    .select('*')
    .eq('brand_id', post.brand_id)
    .eq('platform', post.platform)
    .eq('enabled', true)
    .single();
  if (accountError || !account) return NextResponse.json({ error: `No enabled ${post.platform} account for this brand` }, { status: 400 });

  try {
    const result = await publishPost({ platform: post.platform, caption: post.caption, imageUrl: post.image_url, account });
    await supabaseAdmin.from('posts').update({ status: 'published', published_at: new Date().toISOString(), external_post_id: result.external_post_id || result.id || null, error: null }).eq('id', post.id);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    await supabaseAdmin.from('posts').update({ status: 'failed', error: err.message }).eq('id', post.id);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
