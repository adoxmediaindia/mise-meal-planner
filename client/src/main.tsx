import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.js';
import { AuthProvider } from './context/AuthContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { PlanProvider } from './context/PlanContext.js';
import './index.css';
import './marketing.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <PlanProvider>
            <App />
          </PlanProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
