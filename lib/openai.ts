import OpenAI from 'openai';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  return new OpenAI({ apiKey });
}

function cleanHashtag(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]/g, '')
    .trim();
}

function fallbackCaption(input: { brand: any; topic: string; platform: string }) {
  const brandName = input.brand.name || 'Nixos';
  const domain = input.brand.domain || 'nixos.online';
  const cta = input.brand.cta || `Bekijk de mogelijkheden op ${domain}`;
  const topic = input.topic;

  if (input.platform === 'linkedin') {
    return `${topic}\n\nVeel ondernemers verliezen nog steeds tijd aan handmatig werk: gegevens overtypen, losse Excel-bestanden bijwerken, mails opvolgen en processen controleren die eigenlijk automatisch kunnen lopen.\n\n${brandName} helpt bedrijven om dat slimmer in te richten met AI, workflows en datakoppelingen. Niet als ingewikkeld innovatieproject, maar praktisch: kijken waar tijd weglekt, automatiseren wat terugkomt en zorgen dat processen beter schaalbaar worden.\n\nHet resultaat: minder handmatig werk, minder fouten en meer ruimte voor groei.\n\n${cta}`;
  }

  if (input.platform === 'instagram') {
    return `${topic}\n\nHandmatig werk kost meer dan tijd. Het kost focus, snelheid en schaalbaarheid.\n\nMet slimme AI-workflows automatiseer je terugkerende taken en houd je meer ruimte over voor werk dat echt waarde toevoegt.\n\n${cta}`;
  }

  return `${topic}\n\nVeel processen binnen bedrijven kunnen slimmer. Denk aan repeterende administratie, opvolging, dataverwerking en rapportages.\n\n${brandName} helpt om dit praktisch te automatiseren met AI en workflows.\n\n${cta}`;
}

function fallbackPosts(input: { brand: any; topic: string; platforms: string[] }) {
  const domain = input.brand.domain || 'nixos.online';
  const baseTags = ['AI', 'Automatisering', 'Workflow', 'Ondernemen', cleanHashtag(input.brand.name || 'Nixos')]
    .filter(Boolean)
    .map(tag => `#${tag}`);

  return {
    source: 'free-template-fallback',
    posts: input.platforms.map(platform => ({
      platform,
      caption: fallbackCaption({ brand: input.brand, topic: input.topic, platform }),
      hashtags: platform === 'instagram'
        ? [...baseTags, '#Procesoptimalisatie', '#SlimmerWerken']
        : baseTags,
      image_prompt: null,
      note: `Gratis template-generator gebruikt voor ${domain}; geen betaalde AI API nodig.`
    }))
  };
}

export async function generateSocialCopy(input: {
  brand: any;
  topic: string;
  platforms: string[];
}) {
  if (!process.env.OPENAI_API_KEY || process.env.USE_FREE_TEMPLATE_GENERATOR === 'true') {
    return fallbackPosts(input);
  }

  const prompt = `Maak social media concepten voor merk ${input.brand.name} (${input.brand.domain}).
Beschrijving: ${input.brand.description ?? ''}
Doelgroep: ${input.brand.audience ?? ''}
Tone of voice: ${input.brand.tone_of_voice ?? 'professioneel, direct'}
Aanbod: ${input.brand.offer ?? ''}
CTA: ${input.brand.cta ?? 'Bekijk de website'}
Onderwerp: ${input.topic}
Platforms: ${input.platforms.join(', ')}

Geef geldige JSON terug met array posts: [{platform, caption, hashtags, image_prompt}].`;

  try {
    const response = await getOpenAI().responses.create({
      model: process.env.OPENAI_TEXT_MODEL || 'gpt-5-mini',
      input: prompt
    });

    const text = response.output_text;
    const cleaned = text.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (error: any) {
    const message = String(error?.message || error || '');
    const quotaOrBillingError = error?.status === 429 || message.includes('quota') || message.includes('billing');
    if (quotaOrBillingError) {
      return fallbackPosts(input);
    }
    throw error;
  }
}

export async function generateImageBase64(prompt: string) {
  if (!process.env.OPENAI_API_KEY || process.env.USE_FREE_TEMPLATE_GENERATOR === 'true') return null;

  try {
    const result = await getOpenAI().images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      prompt,
      size: '1024x1024'
    });
    return result.data?.[0]?.b64_json;
  } catch (error: any) {
    const message = String(error?.message || error || '');
    const quotaOrBillingError = error?.status === 429 || message.includes('quota') || message.includes('billing');
    if (quotaOrBillingError) return null;
    throw error;
  }
}
