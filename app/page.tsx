export default function Home() {
  return (
    <main className="container hero">
      <section className="card">
        <span className="badge">Multi-brand social AI publisher</span>
        <h1>Beheer social posts voor al je websites met AI + Telegram-goedkeuring.</h1>
        <p>Voeg merken toe, genereer posts en afbeeldingen, keur ze goed via Telegram en publiceer daarna naar LinkedIn, Facebook en Instagram.</p>
        <a className="button" href="/setup">Start setup wizard</a>
      </section>
      <section className="grid">
        <div className="card"><h2>1. Brands</h2><p>Nixos, MatchNet, InvestCoach of andere websites apart beheren.</p></div>
        <div className="card"><h2>2. AI concepten</h2><p>Tekst + afbeelding per platform genereren.</p></div>
        <div className="card"><h2>3. Telegram approval</h2><p>Approve, Reject of Regenerate voordat iets live gaat.</p></div>
      </section>
    </main>
  );
}
