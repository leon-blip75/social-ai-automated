# Setup checklist

## 1. GitHub + Vercel
- Koppel deze repo aan Vercel.
- Zet alle environment variables uit `.env.example` in Vercel.

## 2. Supabase
- Maak project aan.
- Run `db/schema.sql` in SQL Editor.
- Maak public storage bucket `social-images`.
- Kopieer project URL en service role key naar Vercel.

## 3. OpenAI
- Maak API key aan.
- Zet `OPENAI_API_KEY` in Vercel.

## 4. Telegram
- Maak bot via @BotFather.
- Zet `TELEGRAM_BOT_TOKEN` in Vercel.
- Haal je chat ID op en zet `TELEGRAM_ALLOWED_CHAT_ID`.
- Open `/setup` en klik Telegram webhook instellen.

## 5. Scheduler
- Maak schedule aan in `/setup`.
- Vercel Cron draait elke 15 minuten en checkt of een schedule binnen het venster valt.
- Voorstellen worden automatisch naar Telegram gestuurd.

## 6. Meta / Instagram / Facebook
- Maak Meta app.
- Koppel Facebook Page + Instagram Business/Creator.
- Voeg redirect URL toe.
- Vraag benodigde permissions aan.
- Sla tokens op in `social_accounts`.

## 7. LinkedIn
- Maak LinkedIn app.
- Voeg redirect URL toe.
- Vraag posting permissions aan.
- Sla token + owner URN op in `social_accounts`.
