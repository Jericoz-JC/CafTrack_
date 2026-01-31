import { renderHook } from '@testing-library/react';
import { useCaffeineCalculations } from './useCaffeineCalculations';
import { DEFAULT_SETTINGS } from '../constants/caffeine';

describe('useCaffeineCalculations', () => {
  const baseSettings = DEFAULT_SETTINGS;

  test('returns zero caffeine level with no intakes', () => {
    const { result } = renderHook(() => useCaffeineCalculations([], baseSettings));

    expect(result.current.currentCaffeineLevel).toBe(0);
    // Chart data still has time points, but all levels are 0
    result.current.chartData.forEach(point => {
      expect(point.level).toBe(0);
    });
  });

  test('calculates current caffeine level from recent intake', () => {
    const now = new Date();
    const intakes = [
      {
        id: '1',
        name: 'Coffee',
        amount: 100,
        category: 'coffee',
        timestamp: now.toISOString()
      }
    ];

    const { result } = renderHook(() => useCaffeineCalculations(intakes, baseSettings));

    // Just-consumed caffeine should be at or near 100mg
    expect(result.current.currentCaffeineLevel).toBeGreaterThanOrEqual(95);
    expect(result.current.currentCaffeineLevel).toBeLessThanOrEqual(100);
  });

  test('applies decay to older intakes', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const intakes = [
      {
        id: '1',
        name: 'Coffee',
        amount: 100,
        category: 'coffee',
        timestamp: twoHoursAgo.toISOString()
      }
    ];

    const { result } = renderHook(() => useCaffeineCalculations(intakes, baseSettings));

    // After 2 hours with 5-hour half-life (average), level should be significantly lower
    expect(result.current.currentCaffeineLevel).toBeLessThan(100);
    expect(result.current.currentCaffeineLevel).toBeGreaterThan(50);
  });

  test('generates chart data with time points', () => {
    const now = new Date();
    const intakes = [
      {
        id: '1',
        name: 'Coffee',
        amount: 100,
        category: 'coffee',
        timestamp: now.toISOString()
      }
    ];

    const { result } = renderHook(() => useCaffeineCalculations(intakes, baseSettings));

    expect(result.current.chartData.length).toBeGreaterThan(0);
    expect(result.current.chartData[0]).toHaveProperty('time');
    expect(result.current.chartData[0]).toHaveProperty('level');
  });

  test('calculates sleepTimeInfo correctly', () => {
    const now = new Date();
    const intakes = [
      {
        id: '1',
        name: 'Coffee',
        amount: 100,
        category: 'coffee',
        timestamp: now.toISOString()
      }
    ];

    const { result } = renderHook(() => useCaffeineCalculations(intakes, baseSettings));

    expect(result.current.sleepTimeInfo).toHaveProperty('caffeineAtSleep');
    expect(result.current.sleepTimeInfo).toHaveProperty('isReadyForSleep');
    expect(typeof result.current.sleepTimeInfo.caffeineAtSleep).toBe('number');
    expect(typeof result.current.sleepTimeInfo.isReadyForSleep).toBe('boolean');
  });

  test('isReadyForSleep is true when caffeine at sleep is below target', () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const intakes = [
      {
        id: '1',
        name: 'Coffee',
        amount: 50,
        category: 'coffee',
        timestamp: tenHoursAgo.toISOString()
      }
    ];

    const settings = { ...baseSettings, targetSleepCaffeine: 50 };
    const { result } = renderHook(() => useCaffeineCalculations(intakes, settings));

    // After 10 hours with small amount, should be ready for sleep
    expect(result.current.sleepTimeInfo.isReadyForSleep).toBe(true);
  });

  test('metabolism rate affects decay', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const intakes = [
      {
        id: '1',
        name: 'Coffee',
        amount: 100,
        category: 'coffee',
        timestamp: twoHoursAgo.toISOString()
      }
    ];

    const fastSettings = { ...baseSettings, metabolismRate: 'fast' };
    const slowSettings = { ...baseSettings, metabolismRate: 'slow' };

    const { result: fastResult } = renderHook(() => useCaffeineCalculations(intakes, fastSettings));
    const { result: slowResult } = renderHook(() => useCaffeineCalculations(intakes, slowSettings));

    // Fast metabolism should have lower caffeine level
    expect(fastResult.current.currentCaffeineLevel).toBeLessThan(slowResult.current.currentCaffeineLevel);
  });
});
