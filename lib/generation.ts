import { supabaseAdmin } from '@/lib/supabase';
import { generateSocialCopy } from '@/lib/openai';
import { sendTelegramIdeaApproval } from '@/lib/telegram';

function createFreeImageUrl(prompt: string) {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
}

function normalizeCaption(text: string, max = 900) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '...';
}

function normalizePlatform(platform: unknown) {
  const value = String(platform || '').trim().toLowerCase();
  if (['linkedin', 'facebook', 'instagram'].includes(value)) return value;
  return null;
}

export async function createAndSendBatchConcept(input: {
  brand: any;
  topic: string;
  platforms: string[];
  scheduleId?: string | null;
}) {
  const platforms = Array.from(new Set(input.platforms.map(normalizePlatform).filter(Boolean))) as string[];
  const safePlatforms = platforms.length ? platforms : ['linkedin', 'facebook', 'instagram'];

  const generated = await generateSocialCopy({
    brand: input.brand,
    topic: input.topic,
    platforms: safePlatforms
  });

  const postsSource = Array.isArray(generated?.posts) ? generated.posts : [];

  const imagePrompt = [
    `Modern professional social media image for ${input.brand.name || 'Nixos'}`,
    `Topic: ${input.topic}`,
    `Theme: AI automation, business workflows, efficiency, digital transformation`,
    `Style: premium, clean, modern, realistic, strong composition, suitable for business social media`
  ].join('. ');

  const imageUrl = createFreeImageUrl(imagePrompt);

  const { data: idea, error: ideaError } = await supabaseAdmin
    .from('post_ideas')
    .insert({
      brand_id: input.brand.id,
      schedule_id: input.scheduleId || null,
      topic: input.topic,
      image_prompt: imagePrompt,
      image_url: imageUrl,
      status: 'sent_for_approval'
    })
    .select('*')
    .single();

  if (ideaError) throw ideaError;

  const postsToInsert = safePlatforms.map((platform) => {
    const item = postsSource.find((p: any) => normalizePlatform(p.platform) === platform) || {};
    return {
      idea_id: idea.id,
      brand_id: input.brand.id,
      schedule_id: input.scheduleId || null,
      platform,
      caption: normalizeCaption(item.caption || `${input.topic}\n\n${input.brand.name || 'Nixos'} helpt bedrijven slimmer werken met AI, workflows en automatisering.`),
      hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#AI', '#Automatisering', '#Workflow', '#Nixos'],
      image_prompt: imagePrompt,
      image_url: imageUrl,
      status: 'approval_requested'
    };
  });

  const { data: posts, error: postsError } = await supabaseAdmin
    .from('posts')
    .insert(postsToInsert)
    .select('*');

  if (postsError) throw postsError;

  await sendTelegramIdeaApproval({
    brand: input.brand,
    idea,
    posts: posts || []
  });

  return { idea, posts: posts || [] };
}

export async function createAndSendPostConcepts(input: {
  brand: any;
  topic: string;
  platforms: string[];
  scheduleId?: string | null;
}) {
  const result = await createAndSendBatchConcept(input);
  return result.posts;
}
