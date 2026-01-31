import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Analytics } from '@vercel/analytics/react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL);

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('darkMode') === 'true';
  } catch {
    return false;
  }
};

const AppProviders = ({ children }) => {
  const [useDark, setUseDark] = useState(getInitialDarkMode);

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (typeof event?.detail === 'boolean') {
        setUseDark(event.detail);
      }
    };

    const handleStorage = (event) => {
      if (event.key === 'darkMode') {
        setUseDark(event.newValue === 'true');
      }
    };

    window.addEventListener('caftrack-theme-change', handleThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('caftrack-theme-change', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const clerkAppearance = useMemo(
    () => ({
      variables: useDark
        ? {
            colorBackground: '#05070f',
            colorText: '#e2e8f0',
            colorTextSecondary: '#94a3b8',
            colorPrimary: '#38bdf8',
            colorInputBackground: '#0f172a',
            colorInputText: '#e2e8f0',
            colorDanger: '#fb7185',
            colorSuccess: '#34d399',
            colorWarning: '#fbbf24'
          }
        : {
            colorBackground: '#f8fafc',
            colorText: '#0f172a',
            colorTextSecondary: '#475569',
            colorPrimary: '#2563eb',
            colorInputBackground: '#ffffff',
            colorInputText: '#0f172a',
            colorDanger: '#e11d48',
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b'
          }
    }),
    [useDark]
  );

  return (
    <ClerkProvider
      publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
      <Analytics />
    </AppProviders>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
