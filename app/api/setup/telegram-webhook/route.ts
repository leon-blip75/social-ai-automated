import { NextRequest, NextResponse } from 'next/server';

async function setTelegramWebhook(appUrlFromBody?: string) {
  const appUrl = appUrlFromBody || process.env.APP_URL;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!appUrl || !token || !secret) {
    return NextResponse.json(
      { error: 'Missing APP_URL, TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET' },
      { status: 400 }
    );
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `${appUrl}/api/telegram/webhook`, secret_token: secret })
  });

  const json = await res.json();
  return NextResponse.json({ webhook: `${appUrl}/api/telegram/webhook`, telegram: json }, { status: res.ok ? 200 : 400 });
}

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({}));
  return setTelegramWebhook(url);
}

export async function GET() {
  return setTelegramWebhook();
}
