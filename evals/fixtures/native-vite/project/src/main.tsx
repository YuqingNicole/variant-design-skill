import { createRoot } from 'react-dom/client';
import { WorkspaceProvider } from '@/workspace';
import App from '@/App';
import '@/global.css';
createRoot(document.getElementById('root')!).render(<WorkspaceProvider><App/></WorkspaceProvider>);
