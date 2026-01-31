import {
  calculateCaffeineAtTime,
  getDecayConstant,
  normalizeIntakes,
  normalizeNumber,
  normalizeSettings,
  normalizeTime
} from './caffeine';
import { DEFAULT_SETTINGS, HALF_LIFE_HOURS_BY_RATE } from '../constants/caffeine';

describe('caffeine utils', () => {
  test('normalizeTime pads hours and uses fallback on invalid', () => {
    expect(normalizeTime('9:05', '22:00')).toBe('09:05');
    expect(normalizeTime('25:00', '22:00')).toBe('22:00');
  });

  test('normalizeNumber clamps and parses values', () => {
    expect(normalizeNumber('200', { min: 0, max: 500, fallback: 100 })).toBe(200);
    expect(normalizeNumber(1000, { min: 0, max: 500, fallback: 100 })).toBe(500);
    expect(normalizeNumber('nope', { min: 0, max: 500, fallback: 100 })).toBe(100);
  });

  test('normalizeSettings enforces ranges and types', () => {
    const settings = normalizeSettings({
      metabolismRate: 'fast',
      caffeineLimit: 2000,
      sleepTime: '8:30',
      targetSleepCaffeine: -10,
      pregnancyAdjustment: 'true',
      smokerAdjustment: 'false',
      oralContraceptivesAdjustment: true
    });

    expect(settings.metabolismRate).toBe('fast');
    expect(settings.caffeineLimit).toBe(1000);
    expect(settings.sleepTime).toBe('08:30');
    expect(settings.targetSleepCaffeine).toBe(0);
    expect(settings.pregnancyAdjustment).toBe(true);
    expect(settings.smokerAdjustment).toBe(false);
    expect(settings.oralContraceptivesAdjustment).toBe(true);
  });

  test('normalizeSettings falls back to defaults on invalid input', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  test('normalizeIntakes filters invalid records and fills defaults', () => {
    const validTimestamp = new Date(2026, 0, 1, 10, 0, 0).toISOString();
    const otherTimestamp = new Date(2026, 0, 1, 11, 0, 0).toISOString();
    const result = normalizeIntakes([
      {
        id: '1',
        timestamp: validTimestamp,
        amount: 100
      },
      {
        id: 2,
        timestamp: 'bad',
        amount: 80
      },
      {
        id: '3',
        clientId: 'c3',
        cloudId: 'cloud-3',
        timestamp: otherTimestamp,
        amount: '50',
        name: 'Tea',
        category: 'custom'
      },
      null
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: '1',
      clientId: '1',
      cloudId: null,
      timestamp: validTimestamp,
      updatedAt: new Date(validTimestamp).getTime(),
      amount: 100,
      name: 'Caffeine',
      category: 'custom'
    });
    expect(result[1]).toMatchObject({
      id: '3',
      clientId: 'c3',
      cloudId: 'cloud-3',
      timestamp: otherTimestamp,
      updatedAt: new Date(otherTimestamp).getTime(),
      amount: 50,
      name: 'Tea',
      category: 'custom'
    });
  });

  test('getDecayConstant matches expected half-life', () => {
    const halfLifeHours = HALF_LIFE_HOURS_BY_RATE[DEFAULT_SETTINGS.metabolismRate];
    const expected = Math.log(2) / (halfLifeHours * 60 * 60 * 1000);
    expect(getDecayConstant(DEFAULT_SETTINGS)).toBeCloseTo(expected);
  });

  test('calculateCaffeineAtTime follows half-life decay', () => {
    const halfLifeMs = 2 * 60 * 60 * 1000;
    const intakeTime = new Date(2026, 0, 1, 10, 0, 0).toISOString();
    const targetTime = new Date(2026, 0, 1, 12, 0, 0);
    const intakes = [{ timestamp: intakeTime, amount: 100 }];

    const result = calculateCaffeineAtTime(intakes, targetTime, halfLifeMs);
    expect(result).toBeCloseTo(50, 4);
  });
});
