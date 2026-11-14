'use client';
// Billing and currency controls shared by A, B and C. Under the brand lock the components stay identical;
// only their placement differs between directions.
import { useId } from 'react';
import { currencies, discountPercent, useCurrency, type Currency } from './pricing-data';

export function BillingSegmented({ annual, onChange }: { annual: boolean; onChange: (annual: boolean) => void }) {
  const name = useId();
  return (
    <fieldset className="segmented">
      <legend>Billing</legend>
      <label>
        <input type="radio" name={name} value="annual" checked={annual} onChange={() => onChange(true)} />
        Yearly <span className="save">save {discountPercent}%</span>
      </label>
      <label>
        <input type="radio" name={name} value="monthly" checked={!annual} onChange={() => onChange(false)} />
        Monthly
      </label>
    </fieldset>
  );
}

export function CurrencySelect() {
  const { currency, setCurrency } = useCurrency();
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      Currency
      <select id={id} className="select" name="currency" value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </label>
  );
}
