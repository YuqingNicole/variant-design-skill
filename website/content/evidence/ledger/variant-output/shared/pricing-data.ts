// Shared by directions A, B and C so all three compare the same content.
// Plan data, FAQ copy and the currency context come from the project; nothing here is invented.
import { annualDiscount, faqs, plans, type Plan } from '../../components/plans';
import { type Currency } from '../../components/currency';

export { annualDiscount, faqs, plans };
export type { Plan };
export { CurrencyProvider, useCurrency, type Currency } from '../../components/currency';

export const currencies = ['USD', 'EUR', 'GBP'] as const;
export const trialDays = 30;
export const pageTitle = 'Pricing';
export const pageIntro = 'Every plan includes unlimited invoices and a 30-day free trial.';

// Seat limits read from each plan's `seats` copy ("1 person", "Up to 8 people", "Up to 20 people").
export const seatLimits: Record<Plan['id'], number> = { solo: 1, studio: 8, firm: 20 };
export const maxSeats = seatLimits.firm;

export function planForTeam(people: number): Plan | null {
  if (!Number.isFinite(people) || people < 1) return null;
  return plans.find(p => people <= seatLimits[p.id]) ?? null;
}

export function nextPlanAfter(plan: Plan): Plan | null {
  const index = plans.findIndex(p => p.id === plan.id);
  return plans[index + 1] ?? null;
}

// "Everything in Solo" expands to Solo's actual features so a reader sees the real list per plan.
export function cumulativeFeatures(plan: Plan): string[] {
  const out: string[] = [];
  for (const feature of plan.features) {
    const match = feature.match(/^Everything in (\w+)$/);
    const parent = match ? plans.find(p => p.name === match[1]) : undefined;
    if (parent) out.push(...cumulativeFeatures(parent));
    else out.push(feature);
  }
  return out;
}

export type MatrixRow = { feature: string; firstIn: Plan['id']; included: Record<Plan['id'], boolean> };

// Feature-by-plan matrix in plan order: features first appear in the cheapest plan that includes them.
export function featureMatrix(): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const plan of plans) {
    for (const feature of cumulativeFeatures(plan)) {
      if (rows.some(r => r.feature === feature)) continue;
      const included = Object.fromEntries(plans.map(p => [p.id, cumulativeFeatures(p).includes(feature)])) as Record<Plan['id'], boolean>;
      rows.push({ feature, firstIn: plan.id, included });
    }
  }
  return rows;
}

export function signupHref(plan: Plan, annual: boolean) {
  return `/signup?plan=${plan.id}&billing=${annual ? 'annual' : 'monthly'}`;
}

// Conversion rates mirror components/currency.tsx; they are reused here only so yearly totals stay consistent.
const rates: Record<Currency, number> = { USD: 1, EUR: 0.92, GBP: 0.79 };

// Exact amounts: a money page should not round $9.60 to $10. Whole amounts still print without cents.
export function formatAmount(usd: number, currency: Currency) {
  const amount = Math.round(usd * rates[currency] * 100) / 100;
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(amount);
}

export type Quote = {
  perMonth: string;          // what the chosen cadence costs per month
  billed: string;            // the amount of each charge
  cadence: 'yearly' | 'monthly';
  yearTotal: string;         // cost over twelve months at the chosen cadence
  savingsPerYear: string;    // yearly saving versus monthly billing (annual only)
  monthlyPerMonth: string;   // monthly cadence per-month price, for side-by-side display
  annualPerMonth: string;    // annual cadence per-month price, for side-by-side display
  annualBilled: string;      // annual charge, for side-by-side display
};

export function quote(plan: Plan, annual: boolean, currency: Currency): Quote {
  const monthly = plan.monthlyUsd;
  const annualMonthly = monthly * (1 - annualDiscount);
  const annualCharge = annualMonthly * 12;
  return {
    perMonth: formatAmount(annual ? annualMonthly : monthly, currency),
    billed: formatAmount(annual ? annualCharge : monthly, currency),
    cadence: annual ? 'yearly' : 'monthly',
    yearTotal: formatAmount(annual ? annualCharge : monthly * 12, currency),
    savingsPerYear: formatAmount(monthly * 12 - annualCharge, currency),
    monthlyPerMonth: formatAmount(monthly, currency),
    annualPerMonth: formatAmount(annualMonthly, currency),
    annualBilled: formatAmount(annualCharge, currency),
  };
}

export const discountPercent = Math.round(annualDiscount * 100);

export function conversionNote(currency: Currency) {
  return currency === 'USD' ? null : `Plans are priced in USD. ${currency} amounts are approximate conversions for comparison.`;
}

export function firstChargeDate(from: Date = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + trialDays);
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
