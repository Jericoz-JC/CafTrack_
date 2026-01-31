import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Analytics } from '@vercel/analytics/react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

const hasClerkKey = Boolean(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);
const hasConvexUrl = Boolean(process.env.REACT_APP_CONVEX_URL);
const cloudProvidersEnabled =
  hasClerkKey && hasConvexUrl && process.env.NODE_ENV !== 'test';
const convex = cloudProvidersEnabled
  ? new ConvexReactClient(process.env.REACT_APP_CONVEX_URL)
  : null;

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
          },
      elements: useDark
        ? {
            userButtonPopoverCard: {
              backgroundColor: '#0b1120',
              color: '#e2e8f0',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            },
            userButtonPopoverActionButton: {
              color: '#e2e8f0'
            },
            userButtonPopoverActionButtonText: {
              color: '#e2e8f0'
            },
            userButtonPopoverActionButtonIcon: {
              color: '#94a3b8'
            },
            userButtonPopoverFooter: {
              color: '#94a3b8'
            },
            socialButtonsBlockButton: {
              backgroundColor: '#38bdf8',
              borderColor: '#38bdf8'
            },
            socialButtonsBlockButtonText: {
              color: '#0b1120'
            },
            socialButtonsProviderIcon: {
              color: '#0b1120'
            },
            socialButtonsProviderInitialIcon: {
              color: '#0b1120'
            },
            socialButtonsIconButton: {
              backgroundColor: '#38bdf8',
              borderColor: '#38bdf8'
            },
            socialButtonsIconButtonText: {
              color: '#0b1120'
            },
            socialButtonsIconButtonIcon: {
              color: '#0b1120'
            },
            ssoButtonsBlockButton: {
              backgroundColor: '#38bdf8',
              borderColor: '#38bdf8'
            },
            ssoButtonsBlockButtonText: {
              color: '#0b1120'
            },
            ssoButtonsProviderIcon: {
              color: '#0b1120'
            },
            ssoButtonsProviderInitialIcon: {
              color: '#0b1120'
            },
            ssoButtonsIconButton: {
              backgroundColor: '#38bdf8',
              borderColor: '#38bdf8'
            },
            ssoButtonsIconButtonText: {
              color: '#0b1120'
            },
            ssoButtonsIconButtonIcon: {
              color: '#0b1120'
            },
            enterpriseButtonsBlockButton: {
              backgroundColor: '#38bdf8',
              borderColor: '#38bdf8'
            },
            enterpriseButtonsBlockButtonText: {
              color: '#0b1120'
            },
            enterpriseButtonsProviderIcon: {
              color: '#0b1120'
            },
            enterpriseButtonsProviderInitialIcon: {
              color: '#0b1120'
            },
            enterpriseButtonsIconButton: {
              backgroundColor: '#38bdf8',
              borderColor: '#38bdf8'
            },
            enterpriseButtonsIconButtonText: {
              color: '#0b1120'
            },
            enterpriseButtonsIconButtonIcon: {
              color: '#0b1120'
            }
          }
        : undefined
    }),
    [useDark]
  );

  const clerkLocalization = useMemo(
    () => ({
      signIn: {
        start: {
          subtitle: 'Welcome! Please sign in to continue'
        }
      }
    }),
    []
  );

  if (!cloudProvidersEnabled || !convex) {
    return children;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
      localization={clerkLocalization}
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
