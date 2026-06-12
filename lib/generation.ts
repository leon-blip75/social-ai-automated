import { supabaseAdmin } from '@/lib/supabase';
import { generateSocialCopy } from '@/lib/openai';
import { sendTelegramIdeaApproval } from '@/lib/telegram';

function createFreeImageUrl(prompt: string) {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
}

function normalizeCaption(text: string, max = 650) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '...';
}

function normalizePlatform(platform: unknown) {
  const value = String(platform || '').trim().toLowerCase();
  if (['linkedin', 'facebook', 'instagram'].includes(value)) return value;
  return null;
}

function pickCleanTopic(rawTopic: string) {
  const parts = String(rawTopic || '')
    .split(/[\n,;|]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return 'Praktische automatiseringstip voor ondernemers';
  return parts[Math.floor(Math.random() * parts.length)].slice(0, 120);
}

export async function createAndSendBatchConcept(input: {
  brand: any;
  topic: string;
  platforms: string[];
  scheduleId?: string | null;
}) {
  const topic = pickCleanTopic(input.topic);
  const platforms = Array.from(new Set(input.platforms.map(normalizePlatform).filter(Boolean))) as string[];
  const safePlatforms = platforms.length ? platforms : ['linkedin', 'facebook', 'instagram'];

  const generated = await generateSocialCopy({
    brand: input.brand,
    topic,
    platforms: safePlatforms
  });

  const postsSource = Array.isArray(generated?.posts) ? generated.posts : [];

  const imagePrompt = [
    `Modern professional business image for ${input.brand.name || 'Nixos'}`,
    `Topic: ${topic}`,
    `AI automation, workflow efficiency, digital business processes`,
    `Premium clean style, modern office technology, realistic lighting`
  ].join('. ');

  const imageUrl = createFreeImageUrl(imagePrompt);

  const { data: idea, error: ideaError } = await supabaseAdmin
    .from('post_ideas')
    .insert({
      brand_id: input.brand.id,
      schedule_id: input.scheduleId || null,
      topic,
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
      caption: normalizeCaption(item.caption || `${topic}\n\n${input.brand.name || 'Nixos'} helpt bedrijven slimmer werken met AI, workflows en automatisering.`),
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
