import Link from 'next/link';
export default function Home() {
  return <main style={{ padding: 32 }}><h1>Ledger</h1><p>Bookkeeping for studios of 1–20 people.</p><Link href="/pricing">See pricing</Link></main>;
}
