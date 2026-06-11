export default function HomePage() {
  return (
    <div className="container">
      <p className="eyebrow">Social AI Publisher</p>
      <h1>AI social posts voor meerdere websites, met Telegram-goedkeuring.</h1>
      <p>
        Voeg merken toe, genereer tekst en afbeeldingen, ontvang voorstellen in Telegram en publiceer daarna naar LinkedIn, Facebook en Instagram.
      </p>
      <div className="actions">
        <a className="button" href="/setup">Open setup</a>
        <a className="button secondary" href="/api/setup/checks">Check config</a>
      </div>
    </div>
  );
}
