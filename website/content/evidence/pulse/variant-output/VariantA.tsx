// Variant A — Monday Briefing. Attention-first: the two flagged issues lead, metrics follow as context.
import { useState } from 'react';
import '../src/tokens.css';
import './VariantA.css';
import { anomalies, channels, days, fmt, fmtChange, kpiById, kpis, period, readViewState, verdict } from './shared/pulse-data';

export default function VariantA() {
  const state = readViewState();
  const items = state === 'empty' ? [] : anomalies;
  const [reviewed, setReviewed] = useState<string[]>([]);
  const toggle = (id: string) => setReviewed(r => (r.includes(id) ? r.filter(x => x !== id) : [...r, id]));
  const max = Math.max(...days.map(d => d.dau));
  const byConversion = [...channels].sort((a, b) => b.conversion - a.conversion);
  const remaining = items.length - reviewed.length;

  return (
    <div className="va">
      <main className="va-page">
        {/* zone:header:start */}
        <header className="va-masthead" data-zone="header">
          <p className="va-kicker">Pulse · Weekly report</p>
          <h1>{period.label}</h1>
          <p className="va-range">{period.range}</p>
        </header>
        {/* zone:header:end */}

        {state === 'loading' && (
          <div className="va-loading" role="status" aria-live="polite">
            <span className="va-sr">Loading this week's report…</span>
            <div className="va-skel va-skel--lg" /><div className="va-skel" /><div className="va-skel" /><div className="va-skel va-skel--short" />
          </div>
        )}

        {state === 'error' && (
          <div className="va-error" role="alert">
            <h2>The Oct 19–25 report didn't load</h2>
            <p>Pulse couldn't reach the analytics export. Reload the page; if it still fails, the weekly export may still be running.</p>
            <button type="button" className="va-btn" onClick={() => window.location.reload()}>Reload report</button>
          </div>
        )}

        {(state === 'ready' || state === 'empty') && (
          <>
            {/* zone:attention:start */}
            <section className="va-attention" data-zone="attention" aria-labelledby="va-attention-h">
              <div className="va-attention-head">
                <h2 id="va-attention-h">
                  {items.length === 0 ? 'Nothing flagged this week' : `${items.length} things need your attention`}
                </h2>
                {items.length > 0 && (
                  <p className="va-progress" aria-live="polite">
                    {remaining === 0 ? 'All reviewed — ready for standup' : `${reviewed.length} of ${items.length} reviewed`}
                  </p>
                )}
              </div>
              {items.length === 0 ? (
                <p className="va-empty">No metric crossed its alert threshold. The numbers below are this week's context.</p>
              ) : (
                <ol className="va-items">
                  {items.map((a, i) => {
                    const k = kpiById(a.kpi);
                    const done = reviewed.includes(a.id);
                    return (
                      <li key={a.id} className={`va-item${done ? ' is-done' : ''}`}>
                        <span className="va-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <div className="va-item-body">
                          <h3>{a.title}</h3>
                          <p>{a.text}</p>
                          <p className="va-evidence">
                            <span>{k.label}</span> <strong className="va-mono">{fmt(k.value, k.percent)}</strong>{' '}
                            <span className={`va-delta is-${verdict(k)}`}>
                              <span aria-hidden="true">{k.change > 0 ? '▲' : '▼'}</span> {fmtChange(k.change)} · {verdict(k)} than last week
                            </span>
                            <span className="va-dot" aria-hidden="true">·</span>
                            <span>{days[a.day].long}, {days[a.day].date}</span>
                          </p>
                        </div>
                        <label className="va-check">
                          <input type="checkbox" checked={done} onChange={() => toggle(a.id)} />
                          <span>Reviewed</span>
                        </label>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
            {/* zone:attention:end */}

            {/* zone:metrics:start */}
            <section className="va-context" data-zone="metrics" aria-labelledby="va-context-h">
              <h2 id="va-context-h" className="va-section-h">The rest of the week</h2>
              <dl className="va-kpis">
                {kpis.map(k => (
                  <div key={k.id} className="va-kpi">
                    <dt>{k.label}</dt>
                    <dd className="va-kpi-value va-mono">{fmt(k.value, k.percent)}</dd>
                    <dd className={`va-delta is-${verdict(k)}`}>
                      <span aria-hidden="true">{k.change > 0 ? '▲' : '▼'}</span> {fmtChange(k.change)} <span className="va-muted">vs last week</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            {/* zone:metrics:end */}

            {/* zone:chart:start */}
            <section className="va-block" data-zone="chart" aria-labelledby="va-dau-h">
              <h2 id="va-dau-h" className="va-section-h">Daily active users <span className="va-muted">(thousands)</span></h2>
              <ul className="va-bars" aria-label="Daily active users, Monday to Sunday">
                {days.map((d, i) => {
                  const flagged = items.some(a => a.day === i);
                  return (
                    <li key={d.short} className={flagged ? 'is-flagged' : undefined}>
                      <span className="va-bar-value va-mono">{d.dau.toFixed(1)}k</span>
                      <span className="va-bar" style={{ height: `calc((100% - 1.25rem) * ${(d.dau / max).toFixed(3)})` }} aria-hidden="true" />
                      <span className="va-bar-label">{d.short}{flagged && <span className="va-flag" aria-label="flagged day">●</span>}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
            {/* zone:chart:end */}

            {/* zone:channels:start */}
            <section className="va-block" data-zone="channels" aria-labelledby="va-ch-h">
              <h2 id="va-ch-h" className="va-section-h">Trials by channel <span className="va-muted">— ranked by trial → paid</span></h2>
              <ul className="va-channels">
                {byConversion.map(c => (
                  <li key={c.name} className={items.some(a => a.channel === c.name) ? 'is-flagged' : undefined}>
                    <span className="va-ch-name">{c.name}</span>
                    <span className="va-ch-track" aria-hidden="true"><span style={{ width: `${(c.conversion / 0.3) * 100}%` }} /></span>
                    <span className="va-mono va-ch-rate">{fmt(c.conversion, true)}</span>
                    <span className="va-mono va-muted va-ch-trials">{fmt(c.trials)} trials</span>
                  </li>
                ))}
              </ul>
            </section>
            {/* zone:channels:end */}
          </>
        )}
      </main>
    </div>
  );
}
