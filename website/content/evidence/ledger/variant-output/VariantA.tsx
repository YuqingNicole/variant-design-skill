'use client';
// Direction A — Fit first. A team-size input picks out the plan whose seat limit fits, and a consequence line says
// how much room is left before the next plan. Stateful: team size, billing cadence; currency comes from context.
// The default export wraps the page in CurrencyProvider so the isolated preview runs standalone. The app's layout
// already provides that context, so integration mounts the named export <PricingPageA /> instead.
import { useId, useState } from 'react';
import './shared/preview-fonts.css';
import '../app/globals.css';
import './shared/ledger-extensions.css';
import './shared/ledger-controls.css';
import './VariantA.css';
import { CurrencyProvider, conversionNote, faqs, maxSeats, nextPlanAfter, pageIntro, pageTitle, planForTeam, plans, quote, seatLimits, signupHref, trialDays, useCurrency } from './shared/pricing-data';
import { BillingSegmented, CurrencySelect } from './shared/Controls';

export function PricingPageA() {
  const { currency } = useCurrency();
  const [annual, setAnnual] = useState(true);
  const [teamInput, setTeamInput] = useState('3');
  const teamId = useId();
  const noteId = useId();

  const team = Number(teamInput);
  const wholeNumber = teamInput.trim() !== '' && Number.isInteger(team) && team >= 1;
  const valid = wholeNumber && team <= maxSeats;
  const fit = valid ? planForTeam(team) : null;
  const tooLarge = wholeNumber && team > maxSeats;
  const leadId = fit?.id ?? (tooLarge ? 'firm' : null);
  const note = conversionNote(currency);

  let consequence: string;
  if (teamInput.trim() === '') consequence = `Enter how many people need access, from 1 to ${maxSeats}.`;
  else if (!wholeNumber) consequence = `Enter a whole number from 1 to ${maxSeats}.`;
  else if (tooLarge) consequence = `Firm covers up to ${maxSeats} people. For a larger team, choose Firm and talk to us.`;
  else if (fit) {
    const limit = seatLimits[fit.id];
    const next = nextPlanAfter(fit);
    const people = team === 1 ? 'person' : 'people';
    if (!next) consequence = `${fit.name} covers your ${team} ${people}, up to ${limit} in total.`;
    else if (team === limit) consequence = `${fit.name} fits exactly ${team} ${people}. One more person means ${next.name}.`;
    else consequence = `${fit.name} fits ${team} ${people}, with room for ${limit - team} more before you need ${next.name}.`;
  } else consequence = `Enter a whole number from 1 to ${maxSeats}.`;

  const step = (delta: number) => {
    const base = wholeNumber ? Math.min(team, maxSeats) : 1;
    setTeamInput(String(Math.min(maxSeats, Math.max(1, base + delta))));
  };

  return (
    <main className="ledger variant-a">
      {/* zone:header:start */}
      <header className="page-head" data-zone="header">
        <h1>{pageTitle}</h1>
        <p className="intro">{pageIntro}</p>
      </header>
      {/* zone:header:end */}

      {/* zone:chooser:start */}
      <section className="chooser" data-zone="chooser" aria-labelledby="chooser-title">
        <h2 id="chooser-title">Find the plan that fits</h2>
        <div className="chooser-row">
          <div className="team">
            <label htmlFor={teamId}>People who need access</label>
            <div className="stepper">
              <button type="button" onClick={() => step(-1)} disabled={valid && team <= 1} aria-label="One fewer person">−</button>
              <input id={teamId} type="number" inputMode="numeric" name="team-size" min={1} max={maxSeats} value={teamInput} onChange={e => setTeamInput(e.target.value)} aria-describedby={noteId} aria-invalid={!valid} />
              <button type="button" onClick={() => step(1)} disabled={valid && team >= maxSeats} aria-label="One more person">+</button>
            </div>
          </div>
          <BillingSegmented annual={annual} onChange={setAnnual} />
          <CurrencySelect />
        </div>
        <p id={noteId} className={`consequence${valid ? '' : ' consequence-warn'}`} aria-live="polite">{consequence}</p>
        {note && <p className="note">{note}</p>}
      </section>
      {/* zone:chooser:end */}

      {/* zone:plans:start */}
      <ul className="plans" data-zone="plans">
        {plans.map(p => {
          const q = quote(p, annual, currency);
          const lead = leadId === p.id;
          return (
            <li key={p.id}>
              <section className={`plan${lead ? ' plan-fit' : ''}`} aria-labelledby={`plan-${p.id}`} data-plan={p.id}>
                <header className="plan-head">
                  <h2 id={`plan-${p.id}`}>{p.name}</h2>
                  <p className="plan-seats">{p.seats}</p>
                  {lead && <p className="plan-tag">{fit ? `Fits your team of ${team}` : 'Largest plan'}</p>}
                </header>
                <p className="plan-price">
                  <span className="amount tabular">{q.perMonth}</span>
                  <span className="per"> / month</span>
                </p>
                <p className="plan-billed">{q.billed} billed {q.cadence}</p>
                <ul className="plan-features">
                  {p.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <a className={`btn ${lead ? 'btn-primary' : 'btn-secondary'}`} href={signupHref(p, annual)}>{p.cta}</a>
                <p className="plan-trial">Nothing is charged for {trialDays} days.</p>
              </section>
            </li>
          );
        })}
      </ul>
      {/* zone:plans:end */}

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

export default function VariantA() {
  return (
    <CurrencyProvider>
      <PricingPageA />
    </CurrencyProvider>
  );
}
