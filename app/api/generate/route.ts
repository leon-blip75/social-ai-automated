import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createAndSendPostConcepts } from '@/lib/generation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const domain = String(body.domain || '').trim().toLowerCase();
    const topic = String(body.topic || '').trim();
    const platforms = Array.isArray(body.platforms) && body.platforms.length
      ? body.platforms.map((p: any) => String(p).trim().toLowerCase()).filter(Boolean)
      : ['linkedin', 'facebook', 'instagram'];

    if (!domain || !topic) {
      return NextResponse.json({ error: 'domain and topic are required' }, { status: 400 });
    }

    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('domain', domain)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: `Brand not found: ${domain}`, details: brandError }, { status: 404 });
    }

    const posts = await createAndSendPostConcepts({ brand, topic, platforms });
    return NextResponse.json({ ok: true, posts });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Unknown generate error',
        name: error?.name || null,
        status: error?.status || null,
        cause: error?.cause?.message || null
      },
      { status: 500 }
    );
  }
}
