import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSocialCopy(input: {
  brand: any;
  topic: string;
  platforms: string[];
}) {
  const prompt = `Maak social media concepten voor merk ${input.brand.name} (${input.brand.domain}).
Beschrijving: ${input.brand.description ?? ''}
Doelgroep: ${input.brand.audience ?? ''}
Tone of voice: ${input.brand.tone_of_voice ?? 'professioneel, direct'}
Aanbod: ${input.brand.offer ?? ''}
CTA: ${input.brand.cta ?? 'Bekijk de website'}
Onderwerp: ${input.topic}
Platforms: ${input.platforms.join(', ')}

Geef geldige JSON terug met array posts: [{platform, caption, hashtags, image_prompt}].`;

  const response = await openai.responses.create({
    model: process.env.OPENAI_TEXT_MODEL || 'gpt-5-mini',
    input: prompt
  });

  const text = response.output_text;
  const cleaned = text.replace(/^```json\n?/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

export async function generateImageBase64(prompt: string) {
  const result = await openai.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
    prompt,
    size: '1024x1024'
  });
  return result.data?.[0]?.b64_json;
}
