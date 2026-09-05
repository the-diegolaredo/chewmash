import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../entrypoints/dashboard/style.css';
import './web.css';
import './polish.css';
import '../../../src/ui/nimbus.css';
import './theme.css';
import './page-transitions.css';
import './upload-polish.css';
import './sync-updates.css';
// Load the intended dashboard composition last so later feature styles cannot regress it.
import './original-layout.css';
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
