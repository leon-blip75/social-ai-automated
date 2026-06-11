# Setup checklist voor Social AI Publisher

## Fase 1 - Basis online krijgen
- [ ] GitHub repo maken: social-ai-publisher
- [ ] ZIP inhoud uploaden
- [ ] Vercel project aanmaken vanuit GitHub repo
- [ ] Supabase project aanmaken
- [ ] `db/schema.sql` uitvoeren in Supabase SQL Editor
- [ ] Supabase Storage bucket `social-images` aanmaken en public zetten
- [ ] Vercel env vars invullen

## Fase 2 - Telegram approval
- [ ] Bot maken via @BotFather
- [ ] Bot token in Vercel zetten als `TELEGRAM_BOT_TOKEN`
- [ ] Chat ID ophalen en zetten als `TELEGRAM_ALLOWED_CHAT_ID`
- [ ] Random secret zetten als `TELEGRAM_WEBHOOK_SECRET`
- [ ] `/api/setup/telegram-webhook` aanroepen
- [ ] Testpost genereren via `/setup`

## Fase 3 - OpenAI
- [ ] OpenAI API key aanmaken
- [ ] Key in Vercel zetten als `OPENAI_API_KEY`
- [ ] Tekstgeneratie testen
- [ ] Afbeeldinggeneratie testen

## Fase 4 - Social publishing
- [ ] Meta Developer app aanmaken
- [ ] Facebook Page en Instagram Business/Creator koppelen
- [ ] Long-lived Page/Instagram token opslaan bij `social_accounts`
- [ ] LinkedIn Developer app aanmaken
- [ ] LinkedIn OAuth en author URN opslaan bij `social_accounts`
- [ ] Eerst testpost publiceren naar één kanaal

## Belangrijk
Geen secrets committen naar GitHub. Alleen `.env.example` committen.
