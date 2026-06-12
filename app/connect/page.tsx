export default function ConnectPage() {
  return (
    <main className="container hero">
      <section className="card">
        <h1>Socials koppelen</h1>
        <p>Gebruik deze pagina als checklist voor LinkedIn, Facebook en Instagram. De technische opslag loopt via de API-route /api/social-accounts.</p>
      </section>

      <section className="card">
        <h2>Benodigd per platform</h2>
        <ul>
          <li><strong>LinkedIn:</strong> page/person URN als account_external_id en een geldige LinkedIn access token.</li>
          <li><strong>Facebook:</strong> Page ID als account_external_id en een Page access token.</li>
          <li><strong>Instagram:</strong> Instagram Business User ID als account_external_id en een Meta access token met publishing rechten.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Huidige publicatieflow</h2>
        <p>Na Approve all zoekt de app per platform een enabled social_accounts record. Als dat bestaat, probeert hij te publiceren. Als dat ontbreekt, meldt Telegram netjes dat het platform nog niet gekoppeld is.</p>
      </section>
    </main>
  );
}
