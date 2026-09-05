import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../entrypoints/dashboard/style.css';
import './web.css';
import './polish.css';
import '../../../src/ui/nimbus.css';
import './theme.css';
import './original-layout.css';
import './page-transitions.css';
import { App } from './App';
import { FirstRunGate } from './FirstRunGate';
import { retireLegacyWebCaches } from './retireLegacyWebCaches';
import { SessionWelcome } from './SessionWelcome';

void retireLegacyWebCaches();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirstRunGate>
      <SessionWelcome>
        <App />
      </SessionWelcome>
    </FirstRunGate>
  </StrictMode>,
);
