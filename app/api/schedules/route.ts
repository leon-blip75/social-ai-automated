import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function csv(value: unknown, fallback: string[]) {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('schedules')
    .select('*, brands(name, domain)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, schedules: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { domain, name, timezone = 'Europe/Amsterdam', active = true } = body;
  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 });

  const { data: brand, error: brandError } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('domain', domain)
    .single();

  if (brandError || !brand) return NextResponse.json({ error: `Brand not found: ${domain}` }, { status: 404 });

  const times = csv(body.times, ['07:00']);
  const platforms = csv(body.platforms, ['linkedin', 'facebook', 'instagram']);
  const topics = csv(body.topics, ['Geef een praktische tip die aansluit bij de doelgroep en verwijs subtiel naar de CTA.']);
  const daysOfWeek = csv(body.days_of_week, ['1','2','3','4','5','6','0']).map(Number);

  const { data, error } = await supabaseAdmin
    .from('schedules')
    .insert({
      brand_id: brand.id,
      name: name || `${brand.name} daily social suggestions`,
      timezone,
      times,
      days_of_week: daysOfWeek,
      platforms,
      topics,
      active
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, schedule: data });
}
