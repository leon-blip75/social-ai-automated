import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function normalizePlatform(platform: unknown) {
  const value = String(platform || '').trim().toLowerCase();
  if (['linkedin', 'facebook', 'instagram'].includes(value)) return value;
  return null;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('social_accounts')
    .select('id, brand_id, platform, account_name, account_external_id, enabled, created_at, brands(name, domain)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, accounts: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const domain = String(body.domain || '').trim().toLowerCase();
  const platform = normalizePlatform(body.platform);
  const accessToken = String(body.access_token || '').trim();
  const accountExternalId = String(body.account_external_id || '').trim();

  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  if (!platform) return NextResponse.json({ error: 'platform must be linkedin, facebook or instagram' }, { status: 400 });
  if (!accessToken) return NextResponse.json({ error: 'access_token is required' }, { status: 400 });
  if (!accountExternalId) return NextResponse.json({ error: 'account_external_id is required' }, { status: 400 });

  const { data: brand, error: brandError } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('domain', domain)
    .single();

  if (brandError || !brand) return NextResponse.json({ error: `Brand not found: ${domain}` }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('social_accounts')
    .upsert({
      brand_id: brand.id,
      platform,
      account_name: body.account_name || `${brand.name} ${platform}`,
      account_external_id: accountExternalId,
      access_token: accessToken,
      refresh_token: body.refresh_token || null,
      enabled: String(body.enabled || 'true') !== 'false'
    }, { onConflict: 'brand_id,platform' })
    .select('id, brand_id, platform, account_name, account_external_id, enabled, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, account: data });
}
