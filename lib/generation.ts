import { supabaseAdmin } from '@/lib/supabase';
import { generateSocialCopy, generateImageBase64 } from '@/lib/openai';
import { sendTelegramApproval } from '@/lib/telegram';

async function uploadImage(brandId: string, platform: string, b64: string) {
  const bytes = Buffer.from(b64, 'base64');
  const path = `${brandId}/${Date.now()}-${platform}.png`;
  const { error } = await supabaseAdmin.storage
    .from('social-images')
    .upload(path, bytes, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from('social-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function createAndSendPostConcepts(input: {
  brand: any;
  topic: string;
  platforms: string[];
  scheduleId?: string | null;
}) {
  const generated = await generateSocialCopy({ brand: input.brand, topic: input.topic, platforms: input.platforms });
  const posts = [];

  for (const item of generated.posts || []) {
    let imageUrl: string | null = null;
    if (item.image_prompt) {
      const b64 = await generateImageBase64(item.image_prompt);
      if (b64) imageUrl = await uploadImage(input.brand.id, item.platform, b64);
    }

    const { data: post, error } = await supabaseAdmin.from('posts').insert({
      brand_id: input.brand.id,
      schedule_id: input.scheduleId || null,
      platform: item.platform,
      caption: item.caption,
      hashtags: item.hashtags || [],
      image_prompt: item.image_prompt || null,
      image_url: imageUrl,
      status: 'approval_requested'
    }).select('*').single();
    if (error) throw error;

    await sendTelegramApproval({
      postId: post.id,
      platform: post.platform,
      caption: post.caption,
      imageUrl: post.image_url
    });
    posts.push(post);
  }

  return posts;
}
