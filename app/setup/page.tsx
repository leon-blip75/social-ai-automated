'use client';
import { useState } from 'react';

type CheckResult = { ok: boolean; checks: Record<string, boolean>; missing: string[] };

async function readResponse(res: Response) {
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    return { status: res.status, ok: res.ok, body: json };
  } catch {
    return { status: res.status, ok: res.ok, body: text || 'Geen response body' };
  }
}

export default function SetupPage() {
  const [checks, setChecks] = useState<CheckResult | null>(null);
  const [result, setResult] = useState<string>('');

  async function runChecks() {
    try {
      const res = await fetch('/api/setup/checks');
      setChecks(await res.json());
    } catch (error: any) {
      setResult(`Environment check mislukt: ${error?.message || String(error)}`);
    }
  }

  async function createBrand(formData: FormData) {
    try {
      setResult('Bezig met merk opslaan...');
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const output = await readResponse(res);
      setResult(JSON.stringify(output, null, 2));
    } catch (error: any) {
      setResult(`Merk opslaan mislukt: ${error?.message || String(error)}`);
    }
  }

  async function createSchedule(formData: FormData) {
    try {
      setResult('Bezig met planning opslaan...');
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const output = await readResponse(res);
      setResult(JSON.stringify(output, null, 2));
    } catch (error: any) {
      setResult(`Planning opslaan mislukt: ${error?.message || String(error)}`);
    }
  }

  async function savePlatform(formData: FormData) {
    try {
      setResult('Bezig met platform setup opslaan...');
      const values: any = Object.fromEntries(formData.entries());
      values.access_token = values.platform_key;
      delete values.platform_key;
      const res = await fetch('/api/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const output = await readResponse(res);
      setResult(JSON.stringify(output, null, 2));
    } catch (error: any) {
      setResult(`Platform setup opslaan mislukt: ${error?.message || String(error)}`);
    }
  }

  async function generate(formData: FormData) {
    try {
      setResult('Bezig met post genereren en naar Telegram sturen...');
      const platforms = String(formData.get('platforms') || 'linkedin,facebook,instagram').split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: formData.get('domain'), topic: formData.get('topic'), platforms })
      });
      const output = await readResponse(res);
      setResult(JSON.stringify(output, null, 2));
    } catch (error: any) {
      setResult(`Concept genereren mislukt: ${error?.message || String(error)}`);
    }
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

      <section className="grid">
        <div className="card">
          <h2>LinkedIn setup</h2>
          <p>Voor jouw pagina is de URN:</p>
          <pre>urn:li:organization:116020186</pre>
          <p><a href="https://www.linkedin.com/developers/apps" target="_blank">LinkedIn Developer Portal</a></p>
          <p><a href="https://www.linkedin.com/company/116020186/admin/dashboard/" target="_blank">Jouw LinkedIn company admin</a></p>
          <form action={savePlatform}>
            <input type="hidden" name="platform" value="linkedin" />
            <label>Domein</label><input name="domain" defaultValue="nixos.online" required />
            <label>Naam</label><input name="account_name" defaultValue="Nixos LinkedIn" />
            <label>Account external ID / URN</label><input name="account_external_id" defaultValue="urn:li:organization:116020186" required />
            <label>LinkedIn key</label><textarea name="platform_key" placeholder="Plak hier je LinkedIn waarde" required />
            <p><button className="button" type="submit">LinkedIn opslaan</button></p>
          </form>
        </div>

        <div className="card">
          <h2>Facebook setup</h2>
          <p>Gebruik de Facebook Page ID als account_external_id.</p>
          <p><a href="https://developers.facebook.com/tools/explorer/" target="_blank">Meta Graph API Explorer</a></p>
          <p><a href="https://business.facebook.com/settings/pages" target="_blank">Meta Business Pages</a></p>
          <form action={savePlatform}>
            <input type="hidden" name="platform" value="facebook" />
            <label>Domein</label><input name="domain" defaultValue="nixos.online" required />
            <label>Naam</label><input name="account_name" defaultValue="Nixos Facebook" />
            <label>Facebook Page ID</label><input name="account_external_id" placeholder="Bijv. 123456789012345" required />
            <label>Facebook Page key</label><textarea name="platform_key" placeholder="Plak hier je Facebook waarde" required />
            <p><button className="button" type="submit">Facebook opslaan</button></p>
          </form>
        </div>

        <div className="card">
          <h2>Instagram setup</h2>
          <p>Gebruik de Instagram Business User ID als account_external_id.</p>
          <p><a href="https://developers.facebook.com/tools/explorer/" target="_blank">Meta Graph API Explorer</a></p>
          <p><a href="https://business.facebook.com/settings/instagram-accounts" target="_blank">Meta Business Instagram accounts</a></p>
          <form action={savePlatform}>
            <input type="hidden" name="platform" value="instagram" />
            <label>Domein</label><input name="domain" defaultValue="nixos.online" required />
            <label>Naam</label><input name="account_name" defaultValue="Nixos Instagram" />
            <label>Instagram Business User ID</label><input name="account_external_id" placeholder="Bijv. 17841400000000000" required />
            <label>Instagram/Meta key</label><textarea name="platform_key" placeholder="Plak hier je Meta waarde" required />
            <p><button className="button" type="submit">Instagram opslaan</button></p>
          </form>
        </div>
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
