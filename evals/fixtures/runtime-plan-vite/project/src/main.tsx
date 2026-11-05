import { createRoot } from 'react-dom/client';
import { ReviewProvider } from '@/review';
import App from './App';
import './global.css';
createRoot(document.getElementById('root')!).render(<ReviewProvider><App/></ReviewProvider>);
