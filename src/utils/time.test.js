import { formatTo12Hour, getTimeUntil, parseSleepTime } from './time';

describe('time utils', () => {
  describe('formatTo12Hour', () => {
    test('formats midnight and afternoon', () => {
      expect(formatTo12Hour('00:00')).toBe('12:00 AM');
      expect(formatTo12Hour('13:05')).toBe('1:05 PM');
    });
  });

  describe('parseSleepTime', () => {
    test('returns same-day sleep time', () => {
      const baseDate = new Date(2026, 0, 1, 21, 0, 0);
      const { sleepTimeDate, isNextDay } = parseSleepTime('22:00', baseDate);

      expect(isNextDay).toBe(false);
      expect(sleepTimeDate.getHours()).toBe(22);
      expect(sleepTimeDate.getDate()).toBe(baseDate.getDate());
    });

    test('rolls to next day when time has passed', () => {
      const baseDate = new Date(2026, 0, 1, 23, 30, 0);
      const { sleepTimeDate, isNextDay } = parseSleepTime('22:00', baseDate);

      expect(isNextDay).toBe(true);
      expect(sleepTimeDate.getDate()).toBe(2);
    });
  });

  describe('getTimeUntil', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('returns minutes when under an hour', () => {
      const target = new Date(2026, 0, 1, 10, 30, 0);
      expect(getTimeUntil(target)).toBe('30 min');
    });

    test('returns hours and minutes for longer spans', () => {
      const target = new Date(2026, 0, 1, 12, 15, 0);
      expect(getTimeUntil(target)).toBe('2 hr 15 min');
    });

    test('returns Now for past times', () => {
      const target = new Date(2026, 0, 1, 9, 59, 0);
      expect(getTimeUntil(target)).toBe('Now');
    });
  });
});
