import { render, screen } from '@testing-library/react';
import { SleepReadinessIndicator } from './SleepReadinessIndicator';

describe('SleepReadinessIndicator', () => {
  test('renders readiness state label', () => {
    const now = new Date();
    const sleepDate = new Date(now.getTime() + 60 * 60 * 1000);
    const sleepTime = sleepDate.toTimeString().slice(0, 5);

    const chartData = [
      {
        time: sleepDate.toISOString(),
        level: 40
      }
    ];

    render(
      <SleepReadinessIndicator
        chartData={chartData}
        sleepTime={sleepTime}
        targetLevel={50}
      />
    );

    expect(screen.getByText(/Ready for sleep/i)).toBeInTheDocument();
    expect(screen.getByText(/40 mg/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Target: 50 mg or less at bedtime/i)
    ).toBeInTheDocument();
  });
});
