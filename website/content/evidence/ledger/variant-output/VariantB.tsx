'use client';
// Direction B — Compare by feature. One feature-by-plan matrix with prices and calls to action in a sticky header.
// "Everything in Solo" is expanded into real rows, and a "Show only differences" switch hides rows every plan
// includes. Stateful: billing cadence, differences filter, the plan shown on narrow screens; currency from context.
// The default export wraps the page in CurrencyProvider for the standalone preview; the app's layout already
// provides it, so integration mounts the named export <PricingPageB /> instead.
import { useId, useMemo, useState } from 'react';
import './shared/preview-fonts.css';
import '../app/globals.css';
import './shared/ledger-extensions.css';
import './shared/ledger-controls.css';
import './VariantB.css';
import { CurrencyProvider, conversionNote, faqs, featureMatrix, pageIntro, pageTitle, plans, quote, signupHref, trialDays, useCurrency, type Plan } from './shared/pricing-data';
import { BillingSegmented, CurrencySelect } from './shared/Controls';

export function PricingPageB() {
  const { currency } = useCurrency();
  const [annual, setAnnual] = useState(true);
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [mobilePlan, setMobilePlan] = useState<Plan['id']>('studio');
  const pickerName = useId();
  const diffId = useId();

  const rows = useMemo(() => featureMatrix(), []);
  const visible = differencesOnly ? rows.filter(r => !plans.every(p => r.included[p.id])) : rows;
  const groups = plans.map(p => ({ plan: p, rows: visible.filter(r => r.firstIn === p.id) })).filter(g => g.rows.length > 0);
  const hidden = rows.length - visible.length;
  const note = conversionNote(currency);

  return (
    <main className="ledger variant-b">
      {/* zone:header:start */}
      <header className="page-head" data-zone="header">
        <div className="title">
          <h1>{pageTitle}</h1>
          <p className="intro">{pageIntro}</p>
        </div>
        <div className="toolbar">
          <BillingSegmented annual={annual} onChange={setAnnual} />
          <CurrencySelect />
          <label className="check" htmlFor={diffId}>
            <input id={diffId} type="checkbox" checked={differencesOnly} onChange={e => setDifferencesOnly(e.target.checked)} />
            Show only differences
          </label>
        </div>
        {note && <p className="note">{note}</p>}
        <p className="sr-only" aria-live="polite">{differencesOnly ? `${hidden} shared features hidden` : 'All features shown'}</p>
      </header>
      {/* zone:header:end */}

      {/* zone:matrix:start */}
      <section className="compare" data-zone="matrix" aria-labelledby="compare-title">
        <h2 id="compare-title" className="sr-only">Features by plan</h2>
        <fieldset className="segmented plan-picker">
          <legend>Plan shown</legend>
          {plans.map(p => (
            <label key={p.id}>
              <input type="radio" name={pickerName} value={p.id} checked={mobilePlan === p.id} onChange={() => setMobilePlan(p.id)} />
              {p.name}
            </label>
          ))}
        </fieldset>
        <div className="matrix-wrap" data-mobile-plan={mobilePlan}>
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col" className="col-feature"><span className="sr-only">Feature</span></th>
                {plans.map(p => {
                  const q = quote(p, annual, currency);
                  const lead = p.id === 'studio';
                  return (
                    <th scope="col" key={p.id} className={`col-plan${lead ? ' col-lead' : ''}`} data-plan={p.id}>
                      <div className="plan-head">
                        <span className="plan-name">{p.name}</span>
                        <span className="plan-seats">{p.seats}</span>
                        <span className="plan-price tabular">{q.perMonth}<small> / month</small></span>
                        <span className="plan-billed tabular">{q.billed} billed {q.cadence}</span>
                        <a className={`btn ${lead ? 'btn-primary' : 'btn-secondary'}`} href={signupHref(p, annual)}>{p.cta}</a>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {groups.map(g => (
              <tbody key={g.plan.id}>
                <tr className="group">
                  <th scope="rowgroup" colSpan={plans.length + 1}>{g.plan.id === plans[0].id ? 'In every plan' : `Added in ${g.plan.name}`}</th>
                </tr>
                {g.rows.map(r => (
                  <tr key={r.feature}>
                    <th scope="row">{r.feature}</th>
                    {plans.map(p => (
                      <td key={p.id} data-plan={p.id} className={r.included[p.id] ? 'yes' : 'no'}>
                        <span aria-hidden="true">{r.included[p.id] ? '✓' : '—'}</span>
                        <span className="sr-only">{r.included[p.id] ? 'Included' : 'Not included'}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
            <tfoot>
              <tr>
                <th scope="row">Start</th>
                {plans.map(p => (
                  <td key={p.id} data-plan={p.id}>
                    <a className="btn btn-secondary" href={signupHref(p, annual)}>{p.cta}</a>
                    <span className="trial">Nothing is charged for {trialDays} days.</span>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      {/* zone:matrix:end */}

      {/* zone:faq:start */}
      <section className="faq" data-zone="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">Questions</h2>
        <dl>
          {faqs.map(f => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      {/* zone:faq:end */}
    </main>
  );
}

export default function VariantB() {
  return (
    <CurrencyProvider>
      <PricingPageB />
    </CurrencyProvider>
  );
}
