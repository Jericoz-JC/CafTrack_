const parseTimeString = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
};

export const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [rawHour = '00', rawMinute = '00'] = time24.split(':');
  let hour = parseInt(rawHour, 10);
  const minute = rawMinute.padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
};

export const parseSleepTime = (sleepTime, baseDate = new Date()) => {
  const parsed = parseTimeString(sleepTime);
  const base = baseDate instanceof Date ? new Date(baseDate) : new Date();
  if (!Number.isFinite(base.getTime())) {
    return { sleepTimeDate: new Date(), isNextDay: false };
  }
  if (!parsed) {
    return { sleepTimeDate: base, isNextDay: false };
  }

  const sleepTimeDate = new Date(base);
  sleepTimeDate.setHours(parsed.hours, parsed.minutes, 0, 0);
  let isNextDay = false;
  if (sleepTimeDate < base) {
    sleepTimeDate.setDate(sleepTimeDate.getDate() + 1);
    isNextDay = true;
  }

  return { sleepTimeDate, isNextDay };
};

export const getTimeUntil = (targetTime) => {
  const targetMs = targetTime instanceof Date
    ? targetTime.getTime()
    : typeof targetTime === 'number'
      ? targetTime
      : typeof targetTime === 'string'
        ? new Date(targetTime).getTime()
        : Number.NaN;

  if (!Number.isFinite(targetMs)) return '';

  const diffMs = targetMs - Date.now();
  if (diffMs <= 0) return 'Now';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours === 0) return `${diffMinutes} min`;
  if (diffMinutes === 0) return `${diffHours} hr`;
  return `${diffHours} hr ${diffMinutes} min`;
};
