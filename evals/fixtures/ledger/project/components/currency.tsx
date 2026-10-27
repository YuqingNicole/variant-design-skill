'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'GBP';
const rates: Record<Currency, number> = { USD: 1, EUR: 0.92, GBP: 0.79 };
const CurrencyContext = createContext<{ currency: Currency; setCurrency: (c: Currency) => void } | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}
export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency must be used inside CurrencyProvider');
  return value;
}
export function formatPrice(usd: number, currency: Currency) {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(usd * rates[currency]);
}
