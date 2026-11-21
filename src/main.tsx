import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { installCsrfHeader } from './lib/installCsrfHeader';

installCsrfHeader();

// Guard against React DOM restoreSelection IndexSizeError when text nodes shrink during rapid UI updates
if (typeof Range !== 'undefined' && Range.prototype) {
  const clampRangeOffset = (node: Node, offset: number): number => {
    if (!node) return offset;
    const max =
      node.nodeType === Node.TEXT_NODE ||
      node.nodeType === Node.COMMENT_NODE ||
      node.nodeType === Node.CDATA_SECTION_NODE
        ? (node as CharacterData).length
        : node.childNodes.length;
    return Math.max(0, Math.min(offset, max));
  };
  const originalSetStart = Range.prototype.setStart;
  const originalSetEnd = Range.prototype.setEnd;
  Range.prototype.setStart = function setStartSafe(node: Node, offset: number) {
    return originalSetStart.call(this, node, clampRangeOffset(node, offset));
  };
  Range.prototype.setEnd = function setEndSafe(node: Node, offset: number) {
    return originalSetEnd.call(this, node, clampRangeOffset(node, offset));
  };
}

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


