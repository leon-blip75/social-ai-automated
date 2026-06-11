import { NextResponse } from 'next/server';

const required = [
  'APP_URL', 'APP_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_ALLOWED_CHAT_ID', 'TELEGRAM_WEBHOOK_SECRET'
];

export async function GET() {
  const checks = Object.fromEntries(required.map(key => [key, Boolean(process.env[key])])) as Record<string, boolean>;
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  return NextResponse.json({ ok: missing.length === 0, checks, missing });
}
