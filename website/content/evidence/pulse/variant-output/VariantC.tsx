// Variant C — Evidence Trace. Investigation-first: pick a flag, see its signal, when it happened and where.
import { useRef, useState, type KeyboardEvent } from 'react';
import '../src/tokens.css';
import './VariantC.css';
import { anomalies, channels, days, fmt, fmtChange, kpiById, kpis, period, readViewState, verdict, type Anomaly } from './shared/pulse-data';

const OVERVIEW = 'overview';

export default function VariantC() {
  const state = readViewState();
  const flags: Anomaly[] = state === 'empty' ? [] : anomalies;
  const tabs = [...flags.map(a => a.id), OVERVIEW];
  const [active, setActive] = useState<string>(tabs[0]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = flags.find(a => a.id === active) ?? null;
  const max = Math.max(...days.map(d => d.dau));

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : delta ? (i + delta + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(tabs[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="vc">
      {/* zone:header:start */}
      <header className="vc-bar" data-zone="header">
        <p className="vc-brand">Pulse</p>
        <h1>Weekly report <span>{period.label}</span></h1>
        {(state === 'ready' || state === 'empty') && (
        <dl className="vc-strip" aria-label="Key metrics">
          {kpis.map(k => (
            <div key={k.id} className={`is-${verdict(k)}`}>
              <dt>{k.label}</dt>
              <dd><span className="vc-mono">{fmt(k.value, k.percent)}</span> <span className="vc-chg"><b aria-hidden="true">{k.change > 0 ? '▲' : '▼'}</b>{fmtChange(k.change)}<span className="vc-sr"> ({verdict(k)} than last week)</span></span></dd>
            </div>
          ))}
        </dl>
        )}
      </header>
      {/* zone:header:end */}

      {state === 'loading' && (
        <div className="vc-state" role="status" aria-live="polite"><span className="vc-spinner" aria-hidden="true" /> Loading flags and evidence for {period.label}…</div>
      )}
      {state === 'error' && (
        <div className="vc-state vc-state--error" role="alert">
          <p><strong>Evidence for {period.label} didn't load.</strong> Pulse couldn't reach the analytics export. Reload to try again; if it keeps failing, the weekly export may still be running.</p>
          <button type="button" className="vc-btn" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {(state === 'ready' || state === 'empty') && (
        <div className="vc-layout">
          {/* zone:attention:start */}
          <nav className="vc-rail" data-zone="attention" aria-label="Flags to investigate">
            <h2>{flags.length ? `${flags.length} flags this week` : 'No flags this week'}</h2>
            <div role="tablist" aria-orientation="vertical" aria-label="Flags">
              {tabs.map((id, i) => {
                const a = flags.find(f => f.id === id);
                return (
                  <button
                    key={id}
                    ref={el => { tabRefs.current[i] = el; }}
                    id={`vc-tab-${id}`}
                    role="tab"
                    type="button"
                    aria-selected={active === id}
                    aria-controls="vc-panel"
                    tabIndex={active === id ? 0 : -1}
                    className={`vc-tab${a ? '' : ' vc-tab--overview'}`}
                    onClick={() => setActive(id)}
                    onKeyDown={e => onKey(e, i)}
                  >
                    {a ? (
                      <>
                        <span className="vc-tab-meta vc-mono">{days[a.day].short} · {days[a.day].date}</span>
                        <span className="vc-tab-title">{a.title}</span>
                      </>
                    ) : (
                      <>
                        <span className="vc-tab-meta">Everything else</span>
                        <span className="vc-tab-title">Full week overview</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="vc-hint">Use ↑ ↓ to move between flags.</p>
          </nav>
          {/* zone:attention:end */}

          {/* zone:evidence:start */}
          <section id="vc-panel" role="tabpanel" aria-labelledby={`vc-tab-${active}`} className="vc-panel" data-zone="evidence">
            {current ? (
              <>
                <p className="vc-quote">{current.text}</p>
                <ol className="vc-trail">
                  <li>
                    <h3><span className="vc-step">1</span> Signal</h3>
                    {(() => {
                      const k = kpiById(current.kpi);
                      return (
                        <div className="vc-signal">
                          <p className="vc-signal-label">{k.label}</p>
                          <p className="vc-signal-value vc-mono">{fmt(k.value, k.percent)}</p>
                          <p className={`vc-chg is-${verdict(k)}`}><b aria-hidden="true">{k.change > 0 ? '▲' : '▼'}</b>{fmtChange(k.change)} vs last week — {verdict(k)}{!k.higherIsBetter && ' (lower is better)'}</p>
                        </div>
                      );
                    })()}
                  </li>
                  <li>
                    <h3><span className="vc-step">2</span> When</h3>
                    <WeekChart highlight={current.day} max={max} />
                    <p className="vc-caption">Daily active users (k). {days[current.day].long} is marked; DAU alone does not show this flag, so check the source below.</p>
                  </li>
                  <li>
                    <h3><span className="vc-step">3</span> Where</h3>
                    {current.channel ? (
                      <ChannelTable highlight={current.channel} />
                    ) : (
                      <p className="vc-nochannel">Not tied to an acquisition channel. Source named in the flag: <strong>annual cohort renewals</strong> (61 cancellations). Cohort-level data isn't part of this report yet.</p>
                    )}
                  </li>
                </ol>
              </>
            ) : (
              <div className="vc-overview">
                {flags.length === 0 && <p className="vc-quote">Nothing was flagged for {period.label}. Here is the full week.</p>}
                <h3>Daily active users (k)</h3>
                <WeekChart max={max} />
                <h3>Trials by channel</h3>
                <ChannelTable />
              </div>
            )}
          </section>
          {/* zone:evidence:end */}
        </div>
      )}
    </div>
  );
}

function WeekChart({ highlight, max }: { highlight?: number; max: number }) {
  return (
    <ul className="vc-week" aria-label="Daily active users, Monday to Sunday">
      {days.map((d, i) => (
        <li key={d.short} className={i === highlight ? 'is-hit' : highlight != null ? 'is-dim' : undefined}>
          <span className="vc-week-val vc-mono">{d.dau.toFixed(1)}</span>
          <span className="vc-week-bar" style={{ height: `calc((100% - 1.25rem) * ${(d.dau / max).toFixed(3)})` }} aria-hidden="true" />
          <span className="vc-week-day">{d.short}{i === highlight && <span className="vc-sr"> (flagged day)</span>}</span>
        </li>
      ))}
    </ul>
  );
}

function ChannelTable({ highlight }: { highlight?: string }) {
  return (
    <table className="vc-table">
      <thead><tr><th scope="col">Channel</th><th scope="col">Trials</th><th scope="col">Trial → paid</th></tr></thead>
      <tbody>
        {channels.map(c => (
          <tr key={c.name} className={c.name === highlight ? 'is-hit' : highlight ? 'is-dim' : undefined}>
            <th scope="row">{c.name}{c.name === highlight && <span className="vc-sr"> (flagged)</span>}</th>
            <td className="vc-mono">{fmt(c.trials)}</td>
            <td className="vc-mono">{fmt(c.conversion, true)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
