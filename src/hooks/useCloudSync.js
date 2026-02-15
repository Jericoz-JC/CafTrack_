import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
import { api } from '../convex/_generated/api';
import { mergeIntakesByClientId, mergeSettingsLWW } from '../utils/merge';

const mapCloudIntake = (doc) => ({
  id: doc._id,
  cloudId: doc._id,
  clientId: doc.clientId,
  name: doc.name,
  amount: doc.amount,
  category: doc.category,
  timestamp: doc.timestamp,
  updatedAt: Number.isFinite(doc.updatedAt)
    ? doc.updatedAt
    : new Date(doc.timestamp).getTime()
});

const buildSettingsPayload = (settings, darkMode) => ({
  metabolismRate: settings.metabolismRate,
  caffeineLimit: settings.caffeineLimit,
  sleepTime: settings.sleepTime,
  targetSleepCaffeine: settings.targetSleepCaffeine,
  pregnancyAdjustment: settings.pregnancyAdjustment,
  smokerAdjustment: settings.smokerAdjustment,
  oralContraceptivesAdjustment: settings.oralContraceptivesAdjustment,
  darkMode,
  updatedAt: settings.updatedAt ?? 0
});

const areIntakesEqual = (left = [], right = []) => {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    const a = left[i];
    const b = right[i];
    if (!a || !b) return false;
    if (a.id !== b.id) return false;
    if (a.clientId !== b.clientId) return false;
    if (a.cloudId !== b.cloudId) return false;
    if (a.timestamp !== b.timestamp) return false;
    if (a.amount !== b.amount) return false;
    if (a.name !== b.name) return false;
    if (a.category !== b.category) return false;
    if (a.updatedAt !== b.updatedAt) return false;
  }
  return true;
};
const cloudSyncEnabled = Boolean(
  process.env.REACT_APP_CONVEX_URL &&
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY &&
  process.env.NODE_ENV !== 'test'
);

const useCloudSyncDisabled = () => ({
  isAuthenticated: false,
  isLoading: false,
  cloudReady: false,
  upsertIntake: null,
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
  const hasInitializedSettings = useRef(false);
  const wasAuthenticatedRef = useRef(false);
  const lastPushedSettingsTs = useRef(0);

  const cloudIntakes = useQuery(
    api.intakes.listAll,
    isAuthenticated ? {} : 'skip'
  );
  const cloudSettings = useQuery(
    api.settings.get,
    isAuthenticated ? {} : 'skip'
  );

  // Reset flags only on real logout (auth transition from true to false)
  // This prevents brief auth blips or query skips from clearing state
  useEffect(() => {
    const wasAuthenticated = wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = isAuthenticated;

    // Only reset on real logout: previously authenticated, now not
    if (wasAuthenticated && !isAuthenticated) {
      setHasMigrated(false);
      hasInitializedSettings.current = false;
      lastPushedSettingsTs.current = 0;
    }
  }, [isAuthenticated]);

  const upsertIntake = useMutation(api.intakes.upsertIntake);
  const removeIntake = useMutation(api.intakes.remove);
  const mergeFromLocal = useMutation(api.intakes.mergeFromLocal);
  const saveSettings = useMutation(api.settings.save);

  const cloudReady =
    isAuthenticated && cloudIntakes !== undefined && cloudSettings !== undefined;

  useEffect(() => {
    if (!cloudReady || hasMigrated || !isLocalReady) return;

    let cancelled = false;

    const runMerge = async () => {
      const mappedCloud = cloudIntakes.map(mapCloudIntake);
      const { merged, toUpsert } = mergeIntakesByClientId(localIntakes, mappedCloud);

      setIntakes(merged);

      if (toUpsert.length > 0) {
        try {
          await mergeFromLocal({
            intakes: toUpsert.map((intake) => ({
              clientId: intake.clientId || intake.id,
              name: intake.name,
              amount: intake.amount,
              category: intake.category,
              timestamp: intake.timestamp,
              updatedAt: Number.isFinite(intake.updatedAt)
                ? intake.updatedAt
                : new Date(intake.timestamp).getTime()
            }))
          });
        } catch (error) {
          if (!cancelled) {
            console.error('Cloud merge failed', error);
          }
          return;
        }
      }

      if (!cancelled) {
        setHasMigrated(true);
      }
    };

    runMerge();

    return () => {
      cancelled = true;
    };
  }, [
    cloudReady,
    hasMigrated,
    isLocalReady,
    localIntakes,
    cloudIntakes,
    mergeFromLocal,
    setIntakes
  ]);

  useEffect(() => {
    if (!cloudReady || !hasMigrated || !isLocalReady) return;

    const mappedCloud = cloudIntakes.map(mapCloudIntake);
    const { merged } = mergeIntakesByClientId(localIntakes, mappedCloud);
    if (!areIntakesEqual(merged, localIntakes)) {
      setIntakes(merged);
    }
  }, [
    cloudReady,
    hasMigrated,
    isLocalReady,
    localIntakes,
    cloudIntakes,
    setIntakes
  ]);

  // Build payloads for comparison
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

  // Initial settings merge: run once when cloud is ready
  useEffect(() => {
    if (!cloudReady || !isLocalReady || hasInitializedSettings.current) return;
    hasInitializedSettings.current = true;

    const { merged, shouldPushToCloud } = mergeSettingsLWW(
      localSettingsPayload,
      cloudSettingsPayload
    );

    // If cloud wins, apply cloud settings to local state
    if (merged === cloudSettingsPayload && cloudSettingsPayload) {
      const { darkMode: cloudDarkMode, updatedAt, ...rest } = cloudSettingsPayload;
      setSettings((prev) => ({
        ...prev,
        ...rest,
        updatedAt
      }));
      if (typeof cloudDarkMode === 'boolean') {
        setDarkMode(cloudDarkMode);
      }
      lastPushedSettingsTs.current = updatedAt;
    } else if (shouldPushToCloud) {
      // Local wins and is newer - push to cloud
      saveSettings(localSettingsPayload);
      lastPushedSettingsTs.current = localSettingsPayload.updatedAt;
    } else {
      // Timestamps equal, no action needed
      lastPushedSettingsTs.current = localSettingsPayload.updatedAt;
    }
  }, [
    cloudReady,
    isLocalReady,
    localSettingsPayload,
    cloudSettingsPayload,
    setSettings,
    setDarkMode,
    saveSettings
  ]);

  // Ongoing sync: push local changes when local timestamp is newer
  useEffect(() => {
    if (!cloudReady || !isLocalReady || !hasInitializedSettings.current) return;

    const localTs = localSettingsPayload.updatedAt ?? 0;
    const cloudTs = cloudSettingsPayload?.updatedAt ?? 0;

    // Only push if local is strictly newer and we haven't already pushed this version
    if (localTs > cloudTs && localTs > lastPushedSettingsTs.current) {
      saveSettings(localSettingsPayload);
      lastPushedSettingsTs.current = localTs;
    }
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
    upsertIntake: isAuthenticated ? upsertIntake : null,
    removeIntake: isAuthenticated ? removeIntake : null,
    saveSettings: isAuthenticated ? saveSettings : null,
    cloudSettings
  };
};

export const useCloudSync = cloudSyncEnabled ? useCloudSyncEnabled : useCloudSyncDisabled;
