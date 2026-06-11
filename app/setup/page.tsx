'use client';
import { useState } from 'react';

type CheckResult = { ok: boolean; checks: Record<string, boolean>; missing: string[] };

export default function SetupPage() {
  const [checks, setChecks] = useState<CheckResult | null>(null);
  const [result, setResult] = useState<string>('');

  async function runChecks() {
    const res = await fetch('/api/setup/checks');
    setChecks(await res.json());
  }

  async function createBrand(formData: FormData) {
    setResult('Bezig met merk opslaan...');
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }

  async function createSchedule(formData: FormData) {
    setResult('Bezig met planning opslaan...');
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }

  async function generate(formData: FormData) {
    setResult('Bezig met post genereren en naar Telegram sturen...');
    const platforms = String(formData.get('platforms') || 'linkedin,facebook,instagram').split(',').map(s => s.trim());
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: formData.get('domain'), topic: formData.get('topic'), platforms })
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }

  return (
    <main className="container hero">
      <section className="card">
        <h1>Setup wizard</h1>
        <p>Gebruik deze pagina om stap voor stap je app in te richten.</p>
        <button className="button secondary" onClick={runChecks}>Check environment keys</button>
        {checks && <pre>{JSON.stringify(checks, null, 2)}</pre>}
      </section>

      <section className="card">
        <h2>Merk toevoegen</h2>
        <form action={createBrand}>
          <label>Naam</label><input name="name" placeholder="Nixos" required />
          <label>Domein</label><input name="domain" placeholder="nixos.online" required />
          <label>Beschrijving</label><textarea name="description" placeholder="Wat doet dit merk?" />
          <label>Doelgroep</label><textarea name="audience" placeholder="Voor wie is het?" />
          <label>Tone of voice</label><input name="tone_of_voice" placeholder="professioneel, direct, modern" />
          <label>Aanbod</label><textarea name="offer" placeholder="Wat verkoop/bied je aan?" />
          <label>CTA</label><input name="cta" placeholder="Plan een kennismaking via de website" />
          <p><button className="button" type="submit">Merk opslaan</button></p>
        </form>
      </section>



      <section className="card">
        <h2>Scheduler toevoegen</h2>
        <p>Laat de app automatisch concepten maken en naar Telegram sturen op vaste tijden. Publiceren gebeurt pas na jouw approval.</p>
        <form action={createSchedule}>
          <label>Domein</label><input name="domain" placeholder="nixos.online" required />
          <label>Naam planning</label><input name="name" placeholder="Dagelijkse Nixos social posts" />
          <label>Tijdzone</label><input name="timezone" defaultValue="Europe/Amsterdam" />
          <label>Tijden, komma-gescheiden</label><input name="times" defaultValue="07:00,21:00" />
          <label>Dagen van de week</label><input name="days_of_week" defaultValue="1,2,3,4,5,6,0" />
          <small>0 = zondag, 1 = maandag, 2 = dinsdag, enz.</small>
          <label>Platforms</label><input name="platforms" defaultValue="linkedin,facebook,instagram" />
          <label>Onderwerpen / topic prompts, komma-gescheiden</label><textarea name="topics" defaultValue="Praktische automatiseringstip voor ondernemers,Veelgemaakte fout bij handmatig werken,Waarom AI processen slimmer maakt" />
          <p><button className="button" type="submit">Planning opslaan</button></p>
        </form>
      </section>

      <section className="card">
        <h2>Test: concept genereren</h2>
        <form action={generate}>
          <label>Domein</label><input name="domain" placeholder="nixos.online" required />
          <label>Onderwerp</label><textarea name="topic" placeholder="Waarom bedrijven handmatig werk moeten automatiseren" required />
          <label>Platforms, komma-gescheiden</label><input name="platforms" defaultValue="linkedin,facebook,instagram" />
          <p><button className="button" type="submit">Genereer + stuur naar Telegram</button></p>
        </form>
      </section>

      {result && <section className="card"><h2>Resultaat</h2><pre>{result}</pre></section>}
    </main>
  );
}
