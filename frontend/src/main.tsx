import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app/App';
import { AppProviders } from './app/providers';

import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Не найден HTML-элемент с id="root".');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
