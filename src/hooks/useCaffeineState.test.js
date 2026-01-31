import { renderHook, act, waitFor } from '@testing-library/react';
import { useCaffeineState } from './useCaffeineState';
import { DEFAULT_SETTINGS } from '../constants/caffeine';

describe('useCaffeineState', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes with default values', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.intakes).toEqual([]);
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.darkMode).toBe(false);
  });

  test('loads saved intakes from localStorage', async () => {
    const savedIntakes = [
      {
        id: '1',
        clientId: '1',
        name: 'Coffee',
        amount: 100,
        category: 'coffee',
        timestamp: '2026-01-01T10:00:00.000Z'
      }
    ];
    localStorage.setItem('caffeineIntakes', JSON.stringify(savedIntakes));

    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.intakes).toHaveLength(1);
    expect(result.current.intakes[0].name).toBe('Coffee');
  });

  test('loads saved settings from localStorage', async () => {
    const savedSettings = { ...DEFAULT_SETTINGS, caffeineLimit: 500 };
    localStorage.setItem('caffeineSettings', JSON.stringify(savedSettings));

    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.settings.caffeineLimit).toBe(500);
  });

  test('loads saved darkMode from localStorage', async () => {
    localStorage.setItem('darkMode', 'true');

    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.darkMode).toBe(true);
  });

  test('addIntake creates a new intake with id and timestamp', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.addIntake({
        name: 'Espresso',
        amount: 75,
        category: 'coffee'
      });
    });

    expect(result.current.intakes).toHaveLength(1);
    expect(result.current.intakes[0].name).toBe('Espresso');
    expect(result.current.intakes[0].amount).toBe(75);
    expect(result.current.intakes[0].id).toBeDefined();
    expect(result.current.intakes[0].clientId).toBeDefined();
    expect(result.current.intakes[0].timestamp).toBeDefined();
    expect(result.current.intakes[0].updatedAt).toBeDefined();
  });

  test('addIntake returns the new intake', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    let newIntake;
    act(() => {
      newIntake = result.current.addIntake({
        name: 'Latte',
        amount: 150,
        category: 'coffee'
      });
    });

    expect(newIntake.name).toBe('Latte');
    expect(newIntake.amount).toBe(150);
  });

  test('removeIntake removes an intake from state', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    let intakeId;
    act(() => {
      const intake = result.current.addIntake({
        name: 'Coffee',
        amount: 100,
        category: 'coffee'
      });
      intakeId = intake.id;
    });

    await waitFor(() => {
      expect(result.current.intakes).toHaveLength(1);
    });

    act(() => {
      result.current.removeIntake(intakeId);
    });

    await waitFor(() => {
      expect(result.current.intakes).toHaveLength(0);
    });
  });

  test('removeIntake returns null for non-existent id', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    let removed;
    act(() => {
      removed = result.current.removeIntake('non-existent-id');
    });

    expect(removed).toBeNull();
  });

  test('restoreIntake adds intake back', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    let intake;
    act(() => {
      intake = result.current.addIntake({ name: 'Coffee', amount: 100, category: 'coffee' });
    });

    await waitFor(() => {
      expect(result.current.intakes).toHaveLength(1);
    });

    // Remove the intake
    act(() => {
      result.current.removeIntake(intake.id);
    });

    await waitFor(() => {
      expect(result.current.intakes).toHaveLength(0);
    });

    // Restore it with updated timestamp
    act(() => {
      result.current.restoreIntake(intake, 0);
    });

    await waitFor(() => {
      expect(result.current.intakes).toHaveLength(1);
      expect(result.current.intakes[0].name).toBe('Coffee');
    });
  });

  test('restoreIntake does not duplicate existing intake', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    let intake;
    act(() => {
      intake = result.current.addIntake({
        name: 'Coffee',
        amount: 100,
        category: 'coffee'
      });
    });

    await waitFor(() => {
      expect(result.current.intakes).toHaveLength(1);
    });

    // Try to restore the same intake without removing it first
    act(() => {
      result.current.restoreIntake(intake, 0);
    });

    await waitFor(() => {
      expect(result.current.intakes).toHaveLength(1);
    });
  });

  test('updateSettings merges partial settings', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.updateSettings({ caffeineLimit: 600 });
    });

    expect(result.current.settings.caffeineLimit).toBe(600);
    expect(result.current.settings.metabolismRate).toBe(DEFAULT_SETTINGS.metabolismRate);
  });

  test('setDarkMode toggles dark mode', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.setDarkMode(true);
    });

    expect(result.current.darkMode).toBe(true);

    act(() => {
      result.current.setDarkMode(false);
    });

    expect(result.current.darkMode).toBe(false);
  });

  test('persists intakes to localStorage after changes', async () => {
    const { result } = renderHook(() => useCaffeineState());

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.addIntake({
        name: 'Coffee',
        amount: 100,
        category: 'coffee'
      });
    });

    // Wait for effect to persist
    await waitFor(() => {
      const saved = localStorage.getItem('caffeineIntakes');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved);
      expect(parsed).toHaveLength(1);
    });
  });
});
