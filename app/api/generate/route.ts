import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createAndSendPostConcepts } from '@/lib/generation';

export async function POST(req: NextRequest) {
  const { domain, topic, platforms = ['linkedin', 'facebook', 'instagram'] } = await req.json();
  if (!domain || !topic) return NextResponse.json({ error: 'domain and topic are required' }, { status: 400 });

  const { data: brand, error: brandError } = await supabaseAdmin.from('brands').select('*').eq('domain', domain).single();
  if (brandError || !brand) return NextResponse.json({ error: `Brand not found: ${domain}` }, { status: 404 });

  const posts = await createAndSendPostConcepts({ brand, topic, platforms });
  return NextResponse.json({ ok: true, posts });
}
