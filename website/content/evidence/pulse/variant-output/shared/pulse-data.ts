// Shared, read-only fixture for Variant A/B/C. Values copied verbatim from src/WeeklyReport.tsx.
// Added metadata (higherIsBetter, day labels, anomaly links) is derived from the anomaly text, not new data.

export type Kpi = { id: string; label: string; value: number; change: number; percent?: boolean; higherIsBetter: boolean };
export type Day = { short: string; long: string; date: string; dau: number };
export type Channel = { name: string; trials: number; conversion: number };
export type Anomaly = { id: string; title: string; text: string; kpi: string; day: number; channel?: string };
export type ViewState = 'ready' | 'loading' | 'error' | 'empty';

export const period = { label: 'Oct 19–25', range: 'Mon Oct 19 – Sun Oct 25, 2026' };

export const kpis: Kpi[] = [
  { id: 'wau', label: 'Weekly active users', value: 48210, change: 0.042, higherIsBetter: true },
  { id: 'trials', label: 'New trials', value: 3120, change: -0.087, higherIsBetter: true },
  { id: 'conversion', label: 'Trial → paid', value: 0.186, change: 0.011, percent: true, higherIsBetter: true },
  { id: 'churn', label: 'Churned accounts', value: 214, change: 0.153, higherIsBetter: false },
];

const dauValues = [6.1, 6.4, 6.9, 7.2, 7.0, 7.8, 7.0];
const dayNames = [['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday'], ['Sun', 'Sunday']];
export const days: Day[] = dauValues.map((dau, i) => ({ short: dayNames[i][0], long: dayNames[i][1], date: `Oct ${19 + i}`, dau }));

export const channels: Channel[] = [
  { name: 'Organic search', trials: 1180, conversion: 0.21 },
  { name: 'Paid social', trials: 940, conversion: 0.11 },
  { name: 'Referral', trials: 610, conversion: 0.29 },
  { name: 'Newsletter', trials: 390, conversion: 0.24 },
];

export const anomalies: Anomaly[] = [
  { id: 'paid-social', title: 'Paid social trials fell 31%', text: 'Paid social trials fell 31% after the creative change on Wednesday.', kpi: 'trials', day: 2, channel: 'Paid social' },
  { id: 'annual-churn', title: 'Churn spiked on Saturday', text: 'Churn spiked on Saturday: 61 cancellations from the annual cohort renewing.', kpi: 'churn', day: 5 },
];

const numberFmt = new Intl.NumberFormat('en-US');
const percentFmt = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const changeFmt = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' });

export const fmt = (v: number | null | undefined, percent?: boolean) =>
  v == null || Number.isNaN(v) ? '--' : percent ? percentFmt.format(v) : numberFmt.format(v);
export const fmtChange = (v: number) => changeFmt.format(v);

/** Direction-aware verdict: churn going up is worse, not better. */
export function verdict(k: Kpi): 'better' | 'worse' | 'flat' {
  if (k.change === 0) return 'flat';
  return (k.change > 0) === k.higherIsBetter ? 'better' : 'worse';
}

export const kpiById = (id: string) => kpis.find(k => k.id === id)!;
export const totalTrials = channels.reduce((sum, c) => sum + c.trials, 0);

/** Preview-only switch: append ?state=loading|error|empty to review non-ready states. */
export function readViewState(): ViewState {
  if (typeof window === 'undefined') return 'ready';
  const s = new URLSearchParams(window.location.search).get('state');
  return s === 'loading' || s === 'error' || s === 'empty' ? s : 'ready';
}
