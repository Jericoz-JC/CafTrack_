import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Analytics } from '@vercel/analytics/react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
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
      baseTheme: useDark ? dark : undefined
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
