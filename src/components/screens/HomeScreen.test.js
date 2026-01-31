import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  const defaultProps = {
    currentCaffeineLevel: 150,
    caffeineLimit: 400,
    chartData: [],
    sleepTime: '22:00',
    targetSleepCaffeine: 50,
    darkMode: false
  };

  test('renders caffeine status indicator', () => {
    render(<HomeScreen {...defaultProps} />);

    expect(screen.getByText(/current caffeine level/i)).toBeInTheDocument();
  });

  test('renders sleep readiness indicator', () => {
    render(<HomeScreen {...defaultProps} />);

    expect(screen.getByText(/sleep readiness/i)).toBeInTheDocument();
  });

  test('displays current caffeine level', () => {
    render(<HomeScreen {...defaultProps} currentCaffeineLevel={200} />);

    expect(screen.getByText('200')).toBeInTheDocument();
  });

  test('passes darkMode to child components', () => {
    const { container } = render(<HomeScreen {...defaultProps} darkMode={true} />);

    // Dark mode applies text-slate-100 class
    expect(container.querySelector('.text-slate-100')).toBeInTheDocument();
  });
});
