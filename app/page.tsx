import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: brands } = await supabaseAdmin
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: schedules } = await supabaseAdmin
    .from('schedules')
    .select('*, brands(name, domain)')
    .order('created_at', { ascending: false });

  const { data: socialAccounts } = await supabaseAdmin
    .from('social_accounts')
    .select('id, platform, account_name, account_external_id, enabled, created_at, brands(name, domain)')
    .order('created_at', { ascending: false });

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

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Aangemaakte brands</h2>
        {!brands?.length ? (
          <p>Nog geen brands aangemaakt.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Naam</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Domein</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Tone</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>CTA</th>
                </tr>
              </thead>
              <tbody>
                {brands?.map((brand: any) => (
                  <tr key={brand.id}>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{brand.name}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{brand.domain}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{brand.tone_of_voice || '-'}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{brand.cta || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Aangemelde platform setups</h2>
        {!socialAccounts?.length ? (
          <p>Nog geen LinkedIn, Facebook of Instagram setup opgeslagen.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Brand</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Platform</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Naam</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Account ID / URN</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Actief</th>
                </tr>
              </thead>
              <tbody>
                {socialAccounts?.map((account: any) => (
                  <tr key={account.id}>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{account.brands?.name || '-'} ({account.brands?.domain || '-'})</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{account.platform}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{account.account_name || '-'}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{account.account_external_id || '-'}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{account.enabled ? 'Ja' : 'Nee'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: 24, marginBottom: 48 }}>
        <h2>Aangemaakte schedules</h2>
        {!schedules?.length ? (
          <p>Nog geen schedules aangemaakt.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Naam</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Brand</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Tijden</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Platforms</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Actief</th>
                </tr>
              </thead>
              <tbody>
                {schedules?.map((schedule: any) => (
                  <tr key={schedule.id}>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{schedule.name}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{schedule.brands?.name || '-'} ({schedule.brands?.domain || '-'})</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{(schedule.times || []).join(', ')}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{(schedule.platforms || []).join(', ')}</td>
                    <td style={{ padding: '8px 0', borderTop: '1px solid #334155' }}>{schedule.active ? 'Ja' : 'Nee'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
