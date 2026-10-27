// Plans are shared by the pricing page, checkout and the billing settings page.
export type Plan = { id: 'solo' | 'studio' | 'firm'; name: string; monthlyUsd: number; seats: string; features: string[]; cta: string };
export const plans: Plan[] = [
  { id: 'solo', name: 'Solo', monthlyUsd: 12, seats: '1 person', features: ['Invoices and expenses', 'Bank import', 'Quarterly tax estimate'], cta: 'Start free for 30 days' },
  { id: 'studio', name: 'Studio', monthlyUsd: 39, seats: 'Up to 8 people', features: ['Everything in Solo', 'Project budgets', 'Time to invoice', 'Accountant access'], cta: 'Start free for 30 days' },
  { id: 'firm', name: 'Firm', monthlyUsd: 89, seats: 'Up to 20 people', features: ['Everything in Studio', 'Multi-currency books', 'Approval flows', 'Priority support'], cta: 'Talk to us' },
];
export const annualDiscount = 0.2;
export const faqs = [
  { q: 'Can I change plans later?', a: 'Yes. Upgrades apply immediately; downgrades apply at the next billing date.' },
  { q: 'What happens after the trial?', a: 'We ask for a card on day 30. Nothing is charged before then, and your books stay exportable if you leave.' },
  { q: 'Do you charge per invoice?', a: 'No. Every plan includes unlimited invoices.' },
];
