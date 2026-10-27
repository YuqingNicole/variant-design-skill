import type { ReactNode } from 'react';
import { CurrencyProvider } from '@/components/currency';
import './globals.css';

export const metadata = { title: 'Ledger — bookkeeping for small studios' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><CurrencyProvider>{children}</CurrencyProvider></body>
    </html>
  );
}
