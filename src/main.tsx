import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';
// Stability Lock Verified

import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { installRuntimeApiGuard } from './lib/runtimeApiGuard.ts';

installRuntimeApiGuard();

try {
  document.title = 'Kingdom OS';
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');

  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (e) {
  console.error('[Main] CRITICAL BOOTSTRAP FAILURE:', e);
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; text-align: center; background: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="background: white; padding: 48px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); max-width: 400px;">
        <h1 style="color: #e11d48; margin: 0 0 16px 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">System Error</h1>
        <p style="color: #64748b; margin: 0 0 32px 0; font-weight: 500; line-height: 1.6;">The application core failed to initialize. This is usually due to a missing dependency or a broken update.</p>
        <button onclick="window.location.reload()" style="width: 100%; padding: 16px; border-radius: 16px; border: none; background: #0f172a; color: white; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer;">
          Force Restart
        </button>
      </div>
    </div>
  `;
}
