export const DEFAULT_RANGE_PRESET = '24h';

export const RANGE_PRESETS = [
  { value: '24h', label: '24h', durationMs: 24 * 60 * 60 * 1000 },
  { value: '3d', label: '3 Days', durationMs: 3 * 24 * 60 * 60 * 1000 },
  { value: 'week', label: 'Week', durationMs: 7 * 24 * 60 * 60 * 1000 },
  { value: 'all', label: 'All' }
];

export const getRangeDurationMs = (value) => {
  const preset = RANGE_PRESETS.find((option) => option.value === value);
  return preset?.durationMs ?? null;
};

