Bouw een SaaS-app genaamd Social AI Publisher.

Doel:
Een gebruiker beheert meerdere websites/merken. De app begeleidt de gebruiker door het koppelen van OpenAI, Telegram, Meta/Facebook/Instagram en LinkedIn. Daarna genereert de app automatisch social posts met AI-tekst en AI-afbeeldingen. De gebruiker krijgt concepten via Telegram met knoppen Approve, Reject en Regenerate. Bij Approve publiceert de app automatisch op de gekoppelde social kanalen.

Pagina's:
1. Dashboard met brands en laatste posts.
2. Brand setup wizard:
   - naam
   - domein
   - doelgroep
   - tone of voice
   - aanbod
   - CTA
   - voorbeeldposts
3. Integrations setup:
   - OpenAI key check
   - Telegram bot token check + webhook setup
   - Meta OAuth connect
   - LinkedIn OAuth connect
4. Content calendar:
   - gegenereerde posts
   - status draft/approval/published/failed
5. Post editor:
   - caption aanpassen
   - image prompt aanpassen
   - regenerate image
   - send to Telegram approval
6. Logs/errors.

Database:
Gebruik schema uit db/schema.sql.

Belangrijk:
- Secrets nooit tonen na opslaan.
- Access tokens encrypted opslaan.
- Instagram publishing alleen activeren als IG Business/Creator gekoppeld is aan Facebook Page.
- LinkedIn vereist aparte author URN voor persoon of organisatie.
- Geen automatische publicatie zonder approval, tenzij gebruiker per brand expliciet auto-publish aanzet.
