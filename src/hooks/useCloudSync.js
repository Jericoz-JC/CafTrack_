import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
import { api } from '../convex/_generated/api';

const mapCloudIntake = (doc) => ({
  id: doc._id,
  cloudId: doc._id,
  clientId: doc.clientId,
  name: doc.name,
  amount: doc.amount,
  category: doc.category,
  timestamp: doc.timestamp
});

const buildSettingsPayload = (settings, darkMode) => ({
  metabolismRate: settings.metabolismRate,
  caffeineLimit: settings.caffeineLimit,
  sleepTime: settings.sleepTime,
  targetSleepCaffeine: settings.targetSleepCaffeine,
  pregnancyAdjustment: settings.pregnancyAdjustment,
  smokerAdjustment: settings.smokerAdjustment,
  oralContraceptivesAdjustment: settings.oralContraceptivesAdjustment,
  darkMode
});

const cloudSyncEnabled = Boolean(
  process.env.REACT_APP_CONVEX_URL &&
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY &&
  process.env.NODE_ENV !== 'test'
);

const useCloudSyncDisabled = () => ({
  isAuthenticated: false,
  isLoading: false,
  cloudReady: false,
  addIntake: null,
  removeIntake: null,
  saveSettings: null,
  cloudSettings: null
});

const useCloudSyncEnabled = ({
  localIntakes,
  localSettings,
  darkMode,
  setIntakes,
  setSettings,
  setDarkMode,
  isLocalReady
}) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [hasMigrated, setHasMigrated] = useState(false);
  const lastSettingsFingerprint = useRef(null);

  const cloudIntakes = useQuery(
    api.intakes.listAll,
    isAuthenticated ? {} : 'skip'
  );
  const cloudSettings = useQuery(
    api.settings.get,
    isAuthenticated ? {} : 'skip'
  );

  const addIntake = useMutation(api.intakes.add);
  const removeIntake = useMutation(api.intakes.remove);
  const importFromLocal = useMutation(api.intakes.importFromLocal);
  const saveSettings = useMutation(api.settings.save);

  const cloudReady =
    isAuthenticated && cloudIntakes !== undefined && cloudSettings !== undefined;

  useEffect(() => {
    if (!isAuthenticated || !cloudIntakes) return;
    setIntakes(cloudIntakes.map(mapCloudIntake));
  }, [isAuthenticated, cloudIntakes, setIntakes]);

  useEffect(() => {
    if (!isAuthenticated || !cloudSettings) return;
    const { darkMode: cloudDarkMode, ...rest } = cloudSettings;
    setSettings((prev) => ({
      ...prev,
      ...rest
    }));
    if (typeof cloudDarkMode === 'boolean') {
      setDarkMode(cloudDarkMode);
    }
  }, [isAuthenticated, cloudSettings, setSettings, setDarkMode]);

  useEffect(() => {
    if (!cloudReady || hasMigrated || !isLocalReady) return;

    if (localIntakes.length > 0 && cloudIntakes.length === 0) {
      importFromLocal({
        intakes: localIntakes.map((intake) => ({
          clientId: intake.clientId || intake.id,
          name: intake.name,
          amount: intake.amount,
          category: intake.category,
          timestamp: intake.timestamp
        }))
      });
    }

    setHasMigrated(true);
  }, [
    cloudReady,
    hasMigrated,
    isLocalReady,
    localIntakes,
    cloudIntakes,
    importFromLocal
  ]);

  const localSettingsPayload = useMemo(
    () => buildSettingsPayload(localSettings, darkMode),
    [localSettings, darkMode]
  );

  const cloudSettingsPayload = useMemo(() => {
    if (!cloudSettings) return null;
    const cloudDarkMode =
      typeof cloudSettings.darkMode === 'boolean' ? cloudSettings.darkMode : false;
    return buildSettingsPayload(cloudSettings, cloudDarkMode);
  }, [cloudSettings]);

  useEffect(() => {
    if (!cloudReady || !isLocalReady) return;

    const localFingerprint = JSON.stringify(localSettingsPayload);
    const cloudFingerprint = cloudSettingsPayload
      ? JSON.stringify(cloudSettingsPayload)
      : null;

    if (cloudFingerprint === localFingerprint) {
      lastSettingsFingerprint.current = localFingerprint;
      return;
    }

    if (lastSettingsFingerprint.current === localFingerprint) {
      return;
    }

    saveSettings(localSettingsPayload);
    lastSettingsFingerprint.current = localFingerprint;
  }, [
    cloudReady,
    isLocalReady,
    localSettingsPayload,
    cloudSettingsPayload,
    saveSettings
  ]);

  return {
    isAuthenticated,
    isLoading,
    cloudReady,
    addIntake: isAuthenticated ? addIntake : null,
    removeIntake: isAuthenticated ? removeIntake : null,
    saveSettings: isAuthenticated ? saveSettings : null,
    cloudSettings
  };
};

export const useCloudSync = cloudSyncEnabled ? useCloudSyncEnabled : useCloudSyncDisabled;
