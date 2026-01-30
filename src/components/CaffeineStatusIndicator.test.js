import { render, screen } from '@testing-library/react';
import { CaffeineStatusIndicator } from './CaffeineStatusIndicator';

describe('CaffeineStatusIndicator', () => {
  test('renders status and caffeine value', () => {
    render(
      <CaffeineStatusIndicator currentLevel={40} caffeineLimit={200} />
    );

    expect(screen.getByText('Current Caffeine Level')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText(/Daily Limit: 200 mg/i)).toBeInTheDocument();
  });
});
