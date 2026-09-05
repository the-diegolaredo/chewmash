import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../entrypoints/dashboard/style.css';
import './web.css';
import './polish.css';
import '../../../src/ui/nimbus.css';
import './theme.css';
import { App } from './App';
import { FirstRunGate } from './FirstRunGate';
import { SessionWelcome } from './SessionWelcome';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirstRunGate>
      <SessionWelcome>
        <App />
      </SessionWelcome>
    </FirstRunGate>
  </StrictMode>,
);
