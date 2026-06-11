export async function publishPost(input: {
  platform: 'linkedin' | 'facebook' | 'instagram';
  caption: string;
  imageUrl?: string | null;
  account: any;
}) {
  if (input.platform === 'linkedin') return publishLinkedIn(input);
  if (input.platform === 'facebook') return publishFacebook(input);
  if (input.platform === 'instagram') return publishInstagram(input);
  throw new Error('Unsupported platform');
}

async function publishLinkedIn(input: any) {
  // Placeholder: implement LinkedIn /rest/posts after OAuth + org/person URN is known.
  // For organization posts: author = urn:li:organization:{id}
  // For personal posts: author = urn:li:person:{id}
  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${input.account.access_token}`,
      'LinkedIn-Version': '202604',
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      author: input.account.account_external_id,
      commentary: input.caption,
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return { external_post_id: res.headers.get('x-restli-id') ?? 'linkedin_post' };
}

async function publishFacebook(input: any) {
  const version = process.env.META_GRAPH_VERSION || 'v23.0';
  const pageId = input.account.account_external_id;
  const endpoint = input.imageUrl
    ? `https://graph.facebook.com/${version}/${pageId}/photos`
    : `https://graph.facebook.com/${version}/${pageId}/feed`;

  const payload: any = input.imageUrl
    ? { url: input.imageUrl, caption: input.caption, access_token: input.account.access_token }
    : { message: input.caption, access_token: input.account.access_token };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function publishInstagram(input: any) {
  if (!input.imageUrl) throw new Error('Instagram requires an imageUrl for this implementation');
  const version = process.env.META_GRAPH_VERSION || 'v23.0';
  const igUserId = input.account.account_external_id;

  const createRes = await fetch(`https://graph.facebook.com/${version}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: input.imageUrl, caption: input.caption, access_token: input.account.access_token })
  });
  if (!createRes.ok) throw new Error(await createRes.text());
  const container = await createRes.json();

  const publishRes = await fetch(`https://graph.facebook.com/${version}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: input.account.access_token })
  });
  if (!publishRes.ok) throw new Error(await publishRes.text());
  return publishRes.json();
}
