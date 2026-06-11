import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, domain } = body;
  if (!name || !domain) return NextResponse.json({ error: 'name and domain are required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('brands')
    .upsert({
      name, domain,
      description: body.description || null,
      audience: body.audience || null,
      tone_of_voice: body.tone_of_voice || null,
      offer: body.offer || null,
      cta: body.cta || null
    }, { onConflict: 'domain' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, brand: data });
}
