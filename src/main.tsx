import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle and suppress benign Vite dev server WebSocket disconnect errors in sandboxed iframes
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event?.reason?.message || event?.reason || '');
    if (
      reason.includes('WebSocket') ||
      reason.includes('websocket') ||
      reason.includes('[vite]') ||
      reason.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event?.message || event?.error?.message || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('[vite]') ||
      msg.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

