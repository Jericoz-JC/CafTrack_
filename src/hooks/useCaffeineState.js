import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '../constants/caffeine';
import { normalizeIntakes, normalizeSettings } from '../utils/caffeine';
import { createClientId } from '../utils/id';

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
};

export const useCaffeineState = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [intakes, setIntakes] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedIntakes = localStorage.getItem('caffeineIntakes');
      const savedSettings = localStorage.getItem('caffeineSettings');
      const savedDarkMode = localStorage.getItem('darkMode');

      const parsedIntakes = normalizeIntakes(safeJsonParse(savedIntakes));
      const parsedSettings = normalizeSettings(safeJsonParse(savedSettings));

      setIntakes(parsedIntakes);
      setSettings(parsedSettings);

      if (savedDarkMode != null) {
        setDarkMode(normalizeBool(savedDarkMode, false));
      }
    } catch {
      setIntakes([]);
      setSettings(DEFAULT_SETTINGS);
      setDarkMode(false);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('caffeineIntakes', JSON.stringify(intakes));
    } catch {
      // ignore storage errors
    }
  }, [hydrated, intakes]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('caffeineSettings', JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [hydrated, settings]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('darkMode', darkMode.toString());
    } catch {
      // ignore storage errors
    }
    const themeColor = darkMode ? '#05070f' : '#f5f7fb';
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor);
    }
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('caftrack-theme-change', {
          detail: darkMode
        })
      );
    }
  }, [darkMode, hydrated]);

  const addIntake = useCallback((intakeData) => {
    const clientId = createClientId();
    const timestamp = intakeData.timestamp || new Date().toISOString();
    const updatedAt = Date.now();
    const newIntake = {
      ...intakeData,
      id: clientId,
      clientId,
      timestamp,
      updatedAt
    };
    setIntakes((prev) => [newIntake, ...prev]);
    return newIntake;
  }, []);

  const removeIntake = useCallback((id) => {
    let removed = null;
    let index = -1;
    setIntakes((prev) => {
      index = prev.findIndex((intake) => intake.id === id);
      if (index === -1) return prev;
      removed = prev[index];
      return prev.filter((intake) => intake.id !== id);
    });
    if (!removed) return null;
    return { intake: removed, index };
  }, []);

  const restoreIntake = useCallback((intake, index = 0) => {
    if (!intake) return null;
    const clientId = intake.clientId || intake.id || createClientId();
    const restoredIntake = {
      ...intake,
      id: intake.id || clientId,
      clientId,
      updatedAt: Date.now()
    };
    setIntakes((prev) => {
      if (prev.some((existing) => existing.id === restoredIntake.id)) {
        return prev;
      }
      const next = [...prev];
      const insertAt = Math.min(Math.max(index, 0), next.length);
      next.splice(insertAt, 0, restoredIntake);
      return next;
    });
    return restoredIntake;
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => ({
      ...prev,
      ...partial
    }));
  }, []);

  return {
    intakes,
    settings,
    darkMode,
    hydrated,
    setIntakes,
    setSettings,
    setDarkMode,
    addIntake,
    removeIntake,
    restoreIntake,
    updateSettings
  };
};
