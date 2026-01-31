const getUpdatedAt = (intake) => {
  if (!intake) return 0;
  if (Number.isFinite(intake.updatedAt)) return intake.updatedAt;
  const parsed = intake.timestamp ? new Date(intake.timestamp).getTime() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

const getClientId = (intake) => intake?.clientId || intake?.id || null;

export const mergeIntakesByClientId = (localIntakes = [], cloudIntakes = []) => {
  const mergedMap = new Map();
  const toUpsert = [];

  const cloudByClientId = new Map();
  cloudIntakes.forEach((cloud) => {
    const clientId = getClientId(cloud);
    if (!clientId) return;
    cloudByClientId.set(clientId, { ...cloud, clientId });
  });

  localIntakes.forEach((local) => {
    const clientId = getClientId(local);
    if (!clientId) return;
    const cloud = cloudByClientId.get(clientId);
    const localUpdatedAt = getUpdatedAt(local);

    if (!cloud) {
      const normalizedLocal = { ...local, clientId, updatedAt: localUpdatedAt };
      mergedMap.set(clientId, normalizedLocal);
      toUpsert.push(normalizedLocal);
      return;
    }

    const cloudUpdatedAt = getUpdatedAt(cloud);
    if (localUpdatedAt >= cloudUpdatedAt) {
      const merged = {
        ...cloud,
        ...local,
        clientId,
        updatedAt: localUpdatedAt
      };
      mergedMap.set(clientId, merged);
      toUpsert.push(merged);
    } else {
      mergedMap.set(clientId, {
        ...local,
        ...cloud,
        clientId,
        updatedAt: cloudUpdatedAt
      });
    }
  });

  cloudByClientId.forEach((cloud, clientId) => {
    if (!mergedMap.has(clientId)) {
      mergedMap.set(clientId, {
        ...cloud,
        clientId,
        updatedAt: getUpdatedAt(cloud)
      });
    }
  });

  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return { merged, toUpsert };
};
