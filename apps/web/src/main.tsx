import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../entrypoints/dashboard/style.css';
import './web.css';
import { App } from './App';
import { FirstRunGate } from './FirstRunGate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirstRunGate>
      <App />
    </FirstRunGate>
  </StrictMode>,
);
