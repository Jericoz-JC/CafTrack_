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
  const prevDarkModeRef = useRef(darkMode);
  const localIntakesRef = useRef(localIntakes);
  const cloudIntakesRef = useRef(null);
  const mergeInFlightRef = useRef(false);

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
      mergeInFlightRef.current = false;
    }
  }, [isAuthenticated]);

  // Bump settings.updatedAt when darkMode changes (since darkMode is separate state)
  useEffect(() => {
    if (prevDarkModeRef.current !== darkMode) {
      prevDarkModeRef.current = darkMode;
      // Only bump timestamp after initial sync to avoid overwriting cloud on load
      if (hasInitializedSettings.current) {
        setSettings((prev) => ({
          ...prev,
          updatedAt: Date.now()
        }));
      }
    }
  }, [darkMode, setSettings]);

  const upsertIntake = useMutation(api.intakes.upsertIntake);
  const removeIntake = useMutation(api.intakes.remove);
  const mergeFromLocal = useMutation(api.intakes.mergeFromLocal);
  const saveSettings = useMutation(api.settings.save);

  const cloudReady =
    isAuthenticated && cloudIntakes !== undefined && cloudSettings !== undefined;

  useEffect(() => {
    localIntakesRef.current = localIntakes;
  }, [localIntakes]);

  useEffect(() => {
    if (cloudIntakes !== undefined) {
      cloudIntakesRef.current = cloudIntakes;
    }
  }, [cloudIntakes]);

  useEffect(() => {
    if (!cloudReady || hasMigrated || !isLocalReady || mergeInFlightRef.current) return;

    const cloudSnapshot = cloudIntakesRef.current;
    if (!Array.isArray(cloudSnapshot)) return;

    let cancelled = false;
    mergeInFlightRef.current = true;

    const runMerge = async () => {
      try {
        const mappedCloud = cloudSnapshot.map(mapCloudIntake);
        const { merged, toUpsert } = mergeIntakesByClientId(
          localIntakesRef.current,
          mappedCloud
        );

        if (toUpsert.length > 0) {
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
        }

        if (!cancelled) {
          setIntakes(merged);
          setHasMigrated(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Cloud merge failed', error);
        }
      } finally {
        mergeInFlightRef.current = false;
      }
    };

    runMerge();

    return () => {
      cancelled = true;
      mergeInFlightRef.current = false;
    };
  }, [
    cloudReady,
    hasMigrated,
    isLocalReady,
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
  const localSettingsPayloadRef = useRef(localSettingsPayload);
  const cloudSettingsPayloadRef = useRef(cloudSettingsPayload);

  useEffect(() => {
    localSettingsPayloadRef.current = localSettingsPayload;
  }, [localSettingsPayload]);

  useEffect(() => {
    cloudSettingsPayloadRef.current = cloudSettingsPayload;
  }, [cloudSettingsPayload]);

  // Initial settings merge: run once when cloud is ready
  useEffect(() => {
    if (!cloudReady || !isLocalReady || hasInitializedSettings.current) return;
    hasInitializedSettings.current = true;

    const localSnapshot = localSettingsPayloadRef.current;
    const cloudSnapshot = cloudSettingsPayloadRef.current;
    const { merged, shouldPushToCloud } = mergeSettingsLWW(
      localSnapshot,
      cloudSnapshot
    );

    // If cloud wins, apply cloud settings to local state
    if (merged === cloudSnapshot && cloudSnapshot) {
      const { darkMode: cloudDarkMode, updatedAt, ...rest } = cloudSnapshot;
      setSettings((prev) => ({
        ...prev,
        ...rest,
        updatedAt
      }));
      if (typeof cloudDarkMode === 'boolean') {
        setDarkMode(cloudDarkMode);
        prevDarkModeRef.current = cloudDarkMode;
      }
      lastPushedSettingsTs.current = updatedAt;
    } else if (shouldPushToCloud && localSnapshot) {
      // Local wins and is newer - push to cloud
      saveSettings(localSnapshot);
      lastPushedSettingsTs.current = localSnapshot.updatedAt ?? 0;
    } else {
      // Timestamps equal, no action needed
      lastPushedSettingsTs.current = localSnapshot?.updatedAt ?? 0;
    }
  }, [
    cloudReady,
    isLocalReady,
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
    if (localTs <= cloudTs || localTs <= lastPushedSettingsTs.current) return;
    saveSettings(localSettingsPayload);
    lastPushedSettingsTs.current = localTs;
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
