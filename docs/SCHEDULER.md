# Scheduler

De scheduler maakt automatisch social concepten voor één of meerdere merken/websites.

## Flow

1. Je maakt een schedule aan in `/setup`.
2. Vercel Cron roept iedere 5 minuten `/api/cron/suggest` aan.
3. De route kijkt per schedule of de lokale tijd overeenkomt, bijvoorbeeld `07:00` of `21:00` in `Europe/Amsterdam`.
4. Als de schedule due is, kiest de app een topicprompt.
5. De app genereert tekst + afbeelding.
6. De app stuurt het concept naar Telegram.
7. Jij klikt Approve / Reject / Regenerate.
8. Alleen na approval wordt de post gepubliceerd.

## Voorbeelden

Elke dag om 07:00 en 21:00:

```txt
times: 07:00,21:00
days_of_week: 1,2,3,4,5,6,0
```

Alleen werkdagen om 07:00:

```txt
times: 07:00
days_of_week: 1,2,3,4,5
```

Zondagavond om 21:00:

```txt
times: 21:00
days_of_week: 0
```

## Vercel Cron

`vercel.json` bevat:

```json
{
  "crons": [
    {
      "path": "/api/cron/suggest",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Security

Zet in Vercel:

```env
CRON_SECRET=een-lang-random-secret
```

Roep de route handmatig aan met:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://jouwdomein.nl/api/cron/suggest
```

Let op: als Vercel Cron geen Authorization header kan meesturen in jouw plan, laat `CRON_SECRET` leeg of gebruik een aparte cronprovider die headers ondersteunt.
