import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavigation, FloatingActionButton, BottomNavigation } from './MobileNavigation';

describe('FloatingActionButton', () => {
  test('renders with correct aria-label', () => {
    const onClick = jest.fn();
    render(<FloatingActionButton onClick={onClick} darkMode={false} />);

    const button = screen.getByRole('button', { name: /add caffeine intake/i });
    expect(button).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<FloatingActionButton onClick={onClick} darkMode={false} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('applies dark mode styles', () => {
    const { rerender } = render(<FloatingActionButton onClick={() => {}} darkMode={false} />);
    const button = screen.getByRole('button');

    expect(button.className).toContain('bg-blue-500');

    rerender(<FloatingActionButton onClick={() => {}} darkMode={true} />);
    expect(button.className).toContain('bg-blue-600');
  });
});

describe('BottomNavigation', () => {
  test('renders all three nav buttons', () => {
    render(
      <BottomNavigation
        activeScreen="home"
        onNavigate={() => {}}
        darkMode={false}
      />
    );

    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stats/i })).toBeInTheDocument();
  });

  test('calls onNavigate with correct screen name', () => {
    const onNavigate = jest.fn();
    render(
      <BottomNavigation
        activeScreen="home"
        onNavigate={onNavigate}
        darkMode={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(onNavigate).toHaveBeenCalledWith('history');

    fireEvent.click(screen.getByRole('button', { name: /stats/i }));
    expect(onNavigate).toHaveBeenCalledWith('stats');
  });

  test('has navigation landmark', () => {
    render(
      <BottomNavigation
        activeScreen="home"
        onNavigate={() => {}}
        darkMode={false}
      />
    );

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
  });
});

describe('MobileNavigation', () => {
  test('renders both FAB and bottom navigation', () => {
    render(
      <MobileNavigation
        activeScreen="home"
        onNavigate={() => {}}
        onAddClick={() => {}}
        darkMode={false}
      />
    );

    expect(screen.getByRole('button', { name: /add caffeine intake/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
  });
});
