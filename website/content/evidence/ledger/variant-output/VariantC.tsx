'use client';
// Direction C — Terms first. A single reading column where every plan shows both billing cadences side by side,
// the exact amount of the first charge and the day it lands, followed by a what-happens-when timeline and the FAQ.
// Stateful: billing cadence (which cadence the calls to action use) and the computed first-charge date; currency
// from context. The default export wraps the page in CurrencyProvider for the standalone preview; the app's layout
// already provides it, so integration mounts the named export <PricingPageC /> instead.
import { useEffect, useState } from 'react';
import './shared/preview-fonts.css';
import '../app/globals.css';
import './shared/ledger-extensions.css';
import './shared/ledger-controls.css';
import './VariantC.css';
import { CurrencyProvider, conversionNote, faqs, firstChargeDate, pageIntro, pageTitle, plans, quote, signupHref, trialDays, useCurrency } from './shared/pricing-data';
import { BillingSegmented, CurrencySelect } from './shared/Controls';

export function PricingPageC() {
  const { currency } = useCurrency();
  const [annual, setAnnual] = useState(true);
  // The date depends on the visitor's clock, so it is computed after mount to keep server and client markup identical.
  const [chargeDate, setChargeDate] = useState<string | null>(null);
  useEffect(() => { setChargeDate(firstChargeDate()); }, []);
  const when = chargeDate ? `on or after ${chargeDate}` : `after day ${trialDays}`;
  const note = conversionNote(currency);

  return (
    <main className="ledger variant-c">
      {/* zone:header:start */}
      <header className="page-head" data-zone="header">
        <h1>{pageTitle}</h1>
        <p className="intro">{pageIntro}</p>
        <div className="controls">
          <BillingSegmented annual={annual} onChange={setAnnual} />
          <CurrencySelect />
        </div>
        {note && <p className="note">{note}</p>}
      </header>
      {/* zone:header:end */}

      {/* zone:plans:start */}
      <section className="plans" data-zone="plans" aria-labelledby="plans-title">
        <h2 id="plans-title" className="sr-only">Plans</h2>
        {plans.map(p => {
          const q = quote(p, annual, currency);
          return (
            <article key={p.id} className="plan" aria-labelledby={`plan-${p.id}`} data-plan={p.id}>
              <div className="plan-about">
                <h3 id={`plan-${p.id}`}>{p.name}</h3>
                <p className="plan-seats">{p.seats}</p>
                <ul className="plan-features">
                  {p.features.map(f => <li key={f}>{f}</li>)}
                </ul>
              </div>
              <div className="plan-terms">
                <dl className="rates">
                  <div className={annual ? 'rate chosen' : 'rate'}>
                    <dt>Yearly{annual && <span className="sr-only">, selected</span>}</dt>
                    <dd>
                      <span className="amount tabular">{q.annualPerMonth}</span> / month
                      <span className="sub tabular">{q.annualBilled} once a year</span>
                    </dd>
                  </div>
                  <div className={annual ? 'rate' : 'rate chosen'}>
                    <dt>Monthly{!annual && <span className="sr-only">, selected</span>}</dt>
                    <dd>
                      <span className="amount tabular">{q.monthlyPerMonth}</span> / month
                      <span className="sub tabular">{quote(p, false, currency).yearTotal} over a year</span>
                    </dd>
                  </div>
                </dl>
                <p className="charge" id={`charge-${p.id}`}>
                  <strong>Nothing today.</strong> {q.billed} {when}, then every {annual ? 'year' : 'month'}.
                  {annual && <> Yearly billing saves {q.savingsPerYear} a year.</>}
                </p>
                <a className="btn btn-primary" href={signupHref(p, annual)} aria-describedby={`charge-${p.id}`}>{p.cta}</a>
              </div>
            </article>
          );
        })}
      </section>
      {/* zone:plans:end */}

      {/* zone:terms:start */}
      <section className="terms" data-zone="terms" aria-labelledby="terms-title">
        <h2 id="terms-title">What happens when</h2>
        <ol className="timeline">
          <li>
            <span className="when">Today</span>
            <span className="what">Start a {trialDays}-day trial on any plan. No card until day {trialDays}.</span>
          </li>
          <li>
            <span className="when">Day {trialDays}</span>
            <span className="what">We ask for a card. Nothing is charged before then, and your books stay exportable if you leave.</span>
          </li>
          <li>
            <span className="when">{chargeDate ?? `After day ${trialDays}`}</span>
            <span className="what">First charge for the plan and billing cadence you chose. Upgrades apply immediately; downgrades apply at the next billing date.</span>
          </li>
        </ol>
      </section>
      {/* zone:terms:end */}

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

export default function VariantC() {
  return (
    <CurrencyProvider>
      <PricingPageC />
    </CurrencyProvider>
  );
}
