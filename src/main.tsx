import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent third-party browser extensions (e.g. MetaMask inpage.js) from triggering app error overlays
if (typeof window !== 'undefined') {
  const isExtensionNoise = (msg?: string, source?: string, stack?: string): boolean => {
    const combined = `${msg || ''} ${source || ''} ${stack || ''}`;
    return (
      combined.includes('chrome-extension://') ||
      combined.includes('moz-extension://') ||
      combined.includes('safari-extension://') ||
      combined.includes('Failed to connect to MetaMask')
    );
  };

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const stack = event.error && typeof event.error === 'object' ? (event.error as Error).stack : '';
      if (isExtensionNoise(event.message, event.filename, stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string; stack?: string } | string | undefined;
      const msg = typeof reason === 'string' ? reason : reason?.message;
      const stack = typeof reason === 'object' && reason ? reason.stack : '';
      if (isExtensionNoise(msg, '', stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(<App />);
