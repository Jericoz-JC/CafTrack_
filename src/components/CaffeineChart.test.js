import { render, screen, fireEvent } from '@testing-library/react';
import { CaffeineChart } from './CaffeineChart';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <svg>{children}</svg>,
  AreaChart: ({ children }) => <svg>{children}</svg>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null
}));

describe('CaffeineChart', () => {
  test('renders legend labels', () => {
    render(
      <CaffeineChart
        data={[]}
        caffeineLimit={200}
        sleepTime="22:00"
        targetSleepCaffeine={30}
      />
    );

    expect(screen.getByText(/Caffeine Level$/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Limit \(200 mg\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Sleep Target \(30 mg\)/i)).toBeInTheDocument();
  });

  test('limit input calls onLimitChange on blur', () => {
    const handleLimitChange = jest.fn();

    render(
      <CaffeineChart
        data={[]}
        caffeineLimit={200}
        sleepTime="22:00"
        targetSleepCaffeine={30}
        onLimitChange={handleLimitChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '500' } });
    fireEvent.blur(input);

    expect(handleLimitChange).toHaveBeenCalledTimes(1);
    expect(handleLimitChange).toHaveBeenCalledWith(500);
  });
});
