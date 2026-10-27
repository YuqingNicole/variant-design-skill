'use client';
import { useState } from 'react';
import { annualDiscount, faqs, plans } from '@/components/plans';
import { formatPrice, useCurrency, type Currency } from '@/components/currency';

// Ledger pricing. Visitors are owners of small studios comparing plans before a trial.
export default function PricingPage() {
  const { currency, setCurrency } = useCurrency();
  const [annual, setAnnual] = useState(true);
  const price = (usd: number) => formatPrice(annual ? usd * (1 - annualDiscount) : usd, currency);
  return (
    <main style={{ padding: 32, maxWidth: 1040, margin: '0 auto' }}>
      <h1>Pricing</h1>
      <p>Every plan includes unlimited invoices and a 30-day free trial.</p>
      <div>
        <label><input type="checkbox" checked={annual} onChange={e => setAnnual(e.target.checked)} /> Bill annually (save {annualDiscount * 100}%)</label>
        <label> Currency <select value={currency} onChange={e => setCurrency(e.target.value as Currency)}>{(['USD', 'EUR', 'GBP'] as const).map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {plans.map(p => (
          <section key={p.id} aria-labelledby={`plan-${p.id}`}>
            <h2 id={`plan-${p.id}`}>{p.name}</h2>
            <p>{price(p.monthlyUsd)} / month</p>
            <p>{p.seats}</p>
            <ul>{p.features.map(f => <li key={f}>{f}</li>)}</ul>
            <a href={`/signup?plan=${p.id}&billing=${annual ? 'annual' : 'monthly'}`}>{p.cta}</a>
          </section>
        ))}
      </div>
      <h2>Questions</h2>
      <dl>{faqs.map(f => <div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>)}</dl>
    </main>
  );
}
