// Variant B — Scorecard. Comparison-first: every metric visible at once, sortable channel table, inspectable chart.
import { useState } from 'react';
import '../src/tokens.css';
import './VariantB.css';
import { anomalies, channels, days, fmt, fmtChange, kpis, period, readViewState, totalTrials, verdict, type Channel } from './shared/pulse-data';

type SortKey = 'trials' | 'conversion' | 'paid';
const sortLabels: Record<SortKey, string> = { trials: 'Trials', conversion: 'Trial → paid', paid: 'Est. paid' };

export default function VariantB() {
  const state = readViewState();
  const flags = state === 'empty' ? [] : anomalies;
  const [sort, setSort] = useState<SortKey>('trials');
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const max = Math.max(...days.map(d => d.dau));
  const avg = days.reduce((s, d) => s + d.dau, 0) / days.length;
  const paid = (c: Channel) => Math.round(c.trials * c.conversion);
  const rows = [...channels].sort((a, b) => (sort === 'trials' ? b.trials - a.trials : sort === 'conversion' ? b.conversion - a.conversion : paid(b) - paid(a)));
  const shown = activeDay ?? days.length - 1;

  return (
    <div className="vb">
      {/* zone:header:start */}
      <header className="vb-top" data-zone="header">
        <div>
          <p className="vb-eyebrow">Pulse · Weekly scorecard</p>
          <h1>Week of {period.label}</h1>
        </div>
        <p className="vb-legend">
          <span><b className="is-better" aria-hidden="true">▲</b> better than last week</span>
          <span><b className="is-worse" aria-hidden="true">▼</b> worse than last week</span>
        </p>
      </header>
      {/* zone:header:end */}

      {state === 'loading' && (
        <div className="vb-grid" role="status" aria-live="polite">
          <span className="vb-sr">Loading this week's scorecard…</span>
          {kpis.map(k => <div key={k.id} className="vb-tile vb-skel" />)}
        </div>
      )}

      {state === 'error' && (
        <div className="vb-error" role="alert">
          <strong>The Oct 19–25 scorecard didn't load.</strong> Pulse couldn't reach the analytics export. Reload to try again; if it keeps failing, the weekly export may still be running.
          <button type="button" className="vb-btn" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {(state === 'ready' || state === 'empty') && (
        <>
          {/* zone:metrics:start */}
          <section className="vb-grid" data-zone="metrics" aria-label="Key metrics">
            {kpis.map(k => {
              const v = verdict(k);
              return (
                <article key={k.id} className={`vb-tile is-${v}`}>
                  <h2>{k.label}</h2>
                  <p className="vb-value">{fmt(k.value, k.percent)}</p>
                  <p className="vb-change">
                    <b aria-hidden="true">{k.change > 0 ? '▲' : '▼'}</b> {fmtChange(k.change)}
                    <span className="vb-verdict">{v === 'better' ? 'Better' : v === 'worse' ? 'Worse' : 'Flat'}</span>
                  </p>
                  {!k.higherIsBetter && <p className="vb-note">Lower is better</p>}
                </article>
              );
            })}
          </section>
          {/* zone:metrics:end */}

          <div className="vb-split">
            {/* zone:chart:start */}
            <section className="vb-panel" data-zone="chart" aria-labelledby="vb-dau-h">
              <div className="vb-panel-head">
                <h2 id="vb-dau-h">Daily active users <span className="vb-key"><i aria-hidden="true" /> flagged day</span></h2>
                <p className="vb-readout" aria-live="polite">
                  <span className="vb-mono">{days[shown].dau.toFixed(1)}k</span> {days[shown].long}, {days[shown].date}
                  <span className="vb-muted"> · avg {avg.toFixed(2)}k</span>
                </p>
              </div>
              <div className="vb-chart">
                <div className="vb-avg" style={{ bottom: `calc(28px + (100% - 28px) * ${(avg / max).toFixed(3)})` }} aria-hidden="true"><span>avg</span></div>
                {days.map((d, i) => (
                  <button
                    key={d.short}
                    type="button"
                    className={`vb-col${i === shown ? ' is-active' : ''}${flags.some(a => a.day === i) ? ' is-flagged' : ''}`}
                    aria-pressed={i === shown}
                    aria-label={`${d.long} ${d.date}: ${d.dau.toFixed(1)} thousand daily active users`}
                    onMouseEnter={() => setActiveDay(i)}
                    onFocus={() => setActiveDay(i)}
                    onClick={() => setActiveDay(i)}
                  >
                    <span className="vb-colbar" style={{ height: `${(d.dau / max) * 100}%` }} />
                    <span className="vb-collabel">{d.short}</span>
                  </button>
                ))}
              </div>
            </section>
            {/* zone:chart:end */}

            {/* zone:attention:start */}
            <aside className="vb-panel vb-flags" data-zone="attention" aria-labelledby="vb-flags-h">
              <h2 id="vb-flags-h">Needs attention <span className="vb-count">{flags.length}</span></h2>
              {flags.length === 0 ? (
                <p className="vb-muted">No anomalies flagged this week.</p>
              ) : (
                <ul>
                  {flags.map(a => (
                    <li key={a.id}>
                      <span className="vb-flag-day vb-mono">{days[a.day].short}</span>
                      <span>{a.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
            {/* zone:attention:end */}
          </div>

          {/* zone:channels:start */}
          <section className="vb-panel" data-zone="channels" aria-labelledby="vb-ch-h">
            <div className="vb-panel-head">
              <h2 id="vb-ch-h">Trials by channel</h2>
              <p className="vb-muted">Est. paid = trials × trial → paid rate</p>
            </div>
            <div className="vb-table-wrap">
              <table className="vb-table">
                <thead>
                  <tr>
                    <th scope="col">Channel</th>
                    {(Object.keys(sortLabels) as SortKey[]).map(key => (
                      <th key={key} scope="col" className="vb-num" aria-sort={sort === key ? 'descending' : 'none'}>
                        <button type="button" className="vb-sort" onClick={() => setSort(key)}>
                          {sortLabels[key]} <span aria-hidden="true">{sort === key ? '↓' : '↕'}</span>
                        </button>
                      </th>
                    ))}
                    <th scope="col">Share of trials</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(c => (
                    <tr key={c.name} className={flags.some(a => a.channel === c.name) ? 'is-flagged' : undefined}>
                      <th scope="row" data-label="Channel">
                        {c.name}
                        {flags.some(a => a.channel === c.name) && <span className="vb-tag">flagged</span>}
                      </th>
                      <td className="vb-num" data-label="Trials">{fmt(c.trials)}</td>
                      <td className="vb-num" data-label="Trial → paid">{fmt(c.conversion, true)}</td>
                      <td className="vb-num" data-label="Est. paid">{fmt(paid(c))}</td>
                      <td data-label="Share">
                        <span className="vb-share"><span style={{ width: `${(c.trials / totalTrials) * 100}%` }} /></span>
                        <span className="vb-mono vb-share-pct">{fmt(c.trials / totalTrials, true)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td className="vb-num">{fmt(totalTrials)}</td>
                    <td className="vb-num vb-muted">—</td>
                    <td className="vb-num">{fmt(rows.reduce((s, c) => s + paid(c), 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
          {/* zone:channels:end */}
        </>
      )}
    </div>
  );
}
