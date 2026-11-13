import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { installCsrfHeader } from './lib/installCsrfHeader';

installCsrfHeader();

if (typeof HTMLElement !== 'undefined' && !('popover' in HTMLElement.prototype)) {
  import('@oddbird/popover-polyfill');
}

const rootElement = document.getElementById('root')!;

const appNode = (
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Client mounting:
// The server or build-time SSG provides complete pre-rendered static HTML inside #root
// so search bots (Yandex, Google) and users get instant first paint (FCP < 100ms).
// Mounting with createRoot seamlessly activates full interactivity without strict
// hydration text-node whitespace collapse warnings (React error #418).
createRoot(rootElement).render(appNode);


