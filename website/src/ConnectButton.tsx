import { lazy, Suspense, useState } from 'react';
import type { Language } from './direction-engine';
import './connect-button.css';

// The dialog carries the install commands and prompts (docs-content), so it loads only when the button is pressed and stays out of the home's script.
const ConnectDialog = lazy(() => import('./ConnectDialog'));
export function ConnectButton({ language }: { language: Language }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="site-connect" aria-haspopup="dialog" onClick={() => setOpen(true)}>{language === 'zh' ? '接入' : 'Connect'}</button>{open && <Suspense fallback={null}><ConnectDialog language={language} onClose={() => setOpen(false)}/></Suspense>}</>;
}
