import { DEFAULT_SETTINGS, HALF_LIFE_HOURS_BY_RATE } from '../constants/caffeine';

export const normalizeTime = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallback;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const normalizeNumber = (value, { min, max, fallback }) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const normalizeBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
};

export const normalizeSettings = (candidate) => {
  const base = DEFAULT_SETTINGS;
  if (!candidate || typeof candidate !== 'object') return base;

  const metabolismRate =
    candidate.metabolismRate === 'fast' ||
    candidate.metabolismRate === 'average' ||
    candidate.metabolismRate === 'slow'
      ? candidate.metabolismRate
      : base.metabolismRate;

  return {
    metabolismRate,
    caffeineLimit: normalizeNumber(candidate.caffeineLimit, {
      min: 50,
      max: 1000,
      fallback: base.caffeineLimit
    }),
    sleepTime: normalizeTime(candidate.sleepTime, base.sleepTime),
    targetSleepCaffeine: normalizeNumber(candidate.targetSleepCaffeine, {
      min: 0,
      max: 200,
      fallback: base.targetSleepCaffeine
    }),
    pregnancyAdjustment: normalizeBool(candidate.pregnancyAdjustment, base.pregnancyAdjustment),
    smokerAdjustment: normalizeBool(candidate.smokerAdjustment, base.smokerAdjustment),
    oralContraceptivesAdjustment: normalizeBool(
      candidate.oralContraceptivesAdjustment,
      base.oralContraceptivesAdjustment
    )
  };
};

export const normalizeIntakes = (candidate) => {
  if (!Array.isArray(candidate)) return [];
  const result = [];
  for (const raw of candidate) {
    if (!raw || typeof raw !== 'object') continue;
    const id =
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id
        : typeof raw.id === 'number'
          ? String(raw.id)
          : null;
    const clientId =
      typeof raw.clientId === 'string' && raw.clientId.trim()
        ? raw.clientId
        : id;
    const cloudId =
      typeof raw.cloudId === 'string' && raw.cloudId.trim()
        ? raw.cloudId
        : null;
    const timestamp =
      typeof raw.timestamp === 'string' && raw.timestamp.trim()
        ? raw.timestamp
        : null;
    const parsedTime = timestamp ? new Date(timestamp).getTime() : Number.NaN;
    if (!id || !timestamp || Number.isNaN(parsedTime)) continue;

    const updatedAt = Number.isFinite(raw.updatedAt) ? raw.updatedAt : parsedTime;

    const amount = normalizeNumber(raw.amount, { min: 0, max: 2000, fallback: NaN });
    if (!Number.isFinite(amount)) continue;

    result.push({
      id,
      clientId,
      cloudId,
      timestamp,
      updatedAt,
      amount,
      name: typeof raw.name === 'string' ? raw.name : 'Caffeine',
      category: typeof raw.category === 'string' ? raw.category : 'custom'
    });
  }
  return result;
};

export const getDecayConstant = (settings = DEFAULT_SETTINGS) => {
  const metabolismRate = settings?.metabolismRate;
  let halfLifeHours = HALF_LIFE_HOURS_BY_RATE[metabolismRate] ?? HALF_LIFE_HOURS_BY_RATE.average;

  if (settings?.pregnancyAdjustment) halfLifeHours *= 1.5;
  if (settings?.smokerAdjustment) halfLifeHours *= 0.7;
  if (settings?.oralContraceptivesAdjustment) halfLifeHours *= 1.3;

  const halfLifeMs = halfLifeHours * 60 * 60 * 1000;
  return Math.log(2) / halfLifeMs;
};

export const calculateCaffeineAtTime = (intakes, targetTime, halfLifeMs) => {
  if (!Array.isArray(intakes) || !Number.isFinite(halfLifeMs) || halfLifeMs <= 0) {
    return 0;
  }

  const targetMs = targetTime instanceof Date
    ? targetTime.getTime()
    : typeof targetTime === 'number'
      ? targetTime
      : new Date(targetTime).getTime();

  if (!Number.isFinite(targetMs)) return 0;

  const decayConstant = Math.log(2) / halfLifeMs;
  let total = 0;

  intakes.forEach((intake) => {
    const intakeTimeMs = new Date(intake.timestamp).getTime();
    if (!Number.isFinite(intakeTimeMs)) return;
    const elapsedMs = targetMs - intakeTimeMs;
    if (elapsedMs >= 0) {
      const remainingAmount = intake.amount * Math.exp(-decayConstant * elapsedMs);
      total += remainingAmount;
    }
  });

  return total;
};
