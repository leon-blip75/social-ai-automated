# Social AI Publisher

Een multi-brand social publishing app voor meerdere websites/projecten.

## Wat doet deze app?
- Meerdere merken/websites beheren, zoals Nixos, MatchNet en InvestCoach.
- AI genereert social teksten per platform: LinkedIn, Facebook, Instagram.
- AI genereert afbeeldingen voor posts.
- Concepten worden naar Telegram gestuurd met knoppen: Approve, Reject, Regenerate.
- Na approval publiceert de app automatisch naar gekoppelde social kanalen.

## Stack
- Next.js App Router
- Supabase database + storage
- OpenAI tekst + afbeelding generatie
- Telegram Bot API approval flow
- Meta Graph API voor Facebook Pages + Instagram Business
- LinkedIn Posts API

## Lokaal draaien

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open daarna: http://localhost:3000/setup

## Database
Voer `db/schema.sql` uit in Supabase SQL editor.
Maak daarnaast een public Storage bucket aan met de naam:

```text
social-images
```

## Productie
Gebruik Vercel. Zet alle secrets als Environment Variables in Vercel.

## Setup
Zie `docs/SETUP_CHECKLIST.md`.

## Veiligheid
- Commit nooit echte API keys.
- Gebruik `SUPABASE_SERVICE_ROLE_KEY` alleen server-side.
- Sla tokens in productie versleuteld op.
- Publiceer standaard alleen na handmatige approval via Telegram.


## Scheduler

De app bevat nu een scheduler waarmee je per merk/website automatische concepten kunt laten maken, bijvoorbeeld dagelijks om 07:00 en 21:00. Zie `docs/SCHEDULER.md`.

Belangrijk: de scheduler maakt standaard alleen concepten en stuurt ze naar Telegram. Publiceren gebeurt pas nadat jij op Approve klikt.
