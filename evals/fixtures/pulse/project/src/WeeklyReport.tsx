// Pulse: weekly product analytics for a subscription app. Readers: the product lead on Monday morning.
const kpis = [
  { label: 'Weekly active users', value: 48210, change: 0.042 },
  { label: 'New trials', value: 3120, change: -0.087 },
  { label: 'Trial → paid', value: 0.186, change: 0.011, percent: true },
  { label: 'Churned accounts', value: 214, change: 0.153 },
];
const daily = [6.1, 6.4, 6.9, 7.2, 7.0, 7.8, 7.0];
const channels = [
  { name: 'Organic search', trials: 1180, conversion: 0.21 },
  { name: 'Paid social', trials: 940, conversion: 0.11 },
  { name: 'Referral', trials: 610, conversion: 0.29 },
  { name: 'Newsletter', trials: 390, conversion: 0.24 },
];
const anomalies = ['Paid social trials fell 31% after the creative change on Wednesday.', 'Churn spiked on Saturday: 61 cancellations from the annual cohort renewing.'];
const fmt = (v: number, percent?: boolean) => percent ? `${(v * 100).toFixed(1)}%` : v.toLocaleString('en-US');
export function WeeklyReport() {
  const max = Math.max(...daily);
  return (
    <main>
      <h1>Weekly report · Oct 19–25</h1>
      <section aria-label="Key metrics">{kpis.map(k => <div key={k.label}><h2>{k.label}</h2><p>{fmt(k.value, k.percent)}</p><p>{k.change > 0 ? '+' : ''}{(k.change * 100).toFixed(1)}% vs last week</p></div>)}</section>
      <section aria-label="Daily active users (thousands)"><h2>Daily active users (k)</h2>
        <svg width="420" height="140" role="img" aria-label="Daily active users from Monday to Sunday">{daily.map((d, i) => <rect key={i} x={i * 60} y={140 - (d / max) * 130} width="40" height={(d / max) * 130} fill="currentColor" />)}</svg>
      </section>
      <section><h2>Trials by channel</h2><table><thead><tr><th>Channel</th><th>Trials</th><th>Trial → paid</th></tr></thead><tbody>{channels.map(c => <tr key={c.name}><td>{c.name}</td><td>{c.trials}</td><td>{fmt(c.conversion, true)}</td></tr>)}</tbody></table></section>
      <section><h2>Needs attention</h2><ul>{anomalies.map(a => <li key={a}>{a}</li>)}</ul></section>
    </main>
  );
}
