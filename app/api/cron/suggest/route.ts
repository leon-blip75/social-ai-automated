import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createAndSendPostConcepts } from '@/lib/generation';

function localParts(timezone: string, date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: 'short'
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    timeKey: `${parts.hour}:${parts.minute}`,
    weekday: weekdayMap[parts.weekday] ?? date.getUTCDay()
  };
}

function pickTopic(topics: string[]) {
  if (!topics?.length) return 'Maak een relevante social post met praktische waarde voor de doelgroep.';
  return topics[Math.floor(Math.random() * topics.length)];
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: schedules, error } = await supabaseAdmin
    .from('schedules')
    .select('*, brands(*)')
    .eq('active', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const triggered: any[] = [];
  const skipped: any[] = [];

  for (const schedule of schedules || []) {
    const p = localParts(schedule.timezone || 'Europe/Amsterdam');
    const runKey = `${p.dateKey} ${p.timeKey}`;
    const allowedTime = (schedule.times || []).includes(p.timeKey);
    const allowedDay = (schedule.days_of_week || []).includes(p.weekday);
    const alreadyRan = schedule.last_triggered_key === runKey;

    if (!allowedTime || !allowedDay || alreadyRan) {
      skipped.push({ id: schedule.id, name: schedule.name, reason: { allowedTime, allowedDay, alreadyRan, runKey } });
      continue;
    }

    const topic = pickTopic(schedule.topics || []);
    const posts = await createAndSendPostConcepts({
      brand: schedule.brands,
      topic,
      platforms: schedule.platforms || ['linkedin', 'facebook', 'instagram'],
      scheduleId: schedule.id
    });

    await supabaseAdmin.from('schedules').update({
      last_triggered_at: new Date().toISOString(),
      last_triggered_key: runKey
    }).eq('id', schedule.id);

    triggered.push({ schedule_id: schedule.id, name: schedule.name, topic, posts: posts.map(p => p.id) });
  }

  return NextResponse.json({ ok: true, triggered, skipped_count: skipped.length });
}
