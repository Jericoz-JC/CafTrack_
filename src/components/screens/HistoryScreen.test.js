import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryScreen } from './HistoryScreen';

describe('HistoryScreen', () => {
  const mockIntakes = [
    {
      id: '1',
      name: 'Coffee',
      amount: 100,
      category: 'coffee',
      timestamp: '2026-01-30T10:00:00.000Z'
    },
    {
      id: '2',
      name: 'Tea',
      amount: 50,
      category: 'tea',
      timestamp: '2026-01-30T14:00:00.000Z'
    }
  ];

  const defaultProps = {
    intakes: mockIntakes,
    filteredIntakes: mockIntakes,
    rangePreset: '24h',
    onRangeChange: jest.fn(),
    onRemoveIntake: jest.fn(),
    onAddAction: jest.fn(),
    darkMode: false
  };

  test('renders intake history heading', () => {
    render(<HistoryScreen {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /intake history/i })).toBeInTheDocument();
  });

  test('renders range selector', () => {
    render(<HistoryScreen {...defaultProps} />);

    expect(screen.getByText(/history range/i)).toBeInTheDocument();
  });

  test('renders intake items', () => {
    render(<HistoryScreen {...defaultProps} />);

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });

  test('shows empty message when no intakes', () => {
    render(<HistoryScreen {...defaultProps} intakes={[]} filteredIntakes={[]} />);

    expect(screen.getByText(/no caffeine intake recorded/i)).toBeInTheDocument();
  });

  test('shows no entries for range message when filtered is empty but intakes exist', () => {
    render(<HistoryScreen {...defaultProps} filteredIntakes={[]} />);

    expect(screen.getByText(/no entries for this range/i)).toBeInTheDocument();
  });

  test('calls onAddAction when add button clicked', () => {
    const onAddAction = jest.fn();
    render(<HistoryScreen {...defaultProps} intakes={[]} filteredIntakes={[]} onAddAction={onAddAction} />);

    fireEvent.click(screen.getByRole('button', { name: /add your first drink/i }));
    expect(onAddAction).toHaveBeenCalledTimes(1);
  });

  test('calls onRemoveIntake when remove clicked', () => {
    const onRemoveIntake = jest.fn();
    render(<HistoryScreen {...defaultProps} onRemoveIntake={onRemoveIntake} />);

    // Click the first remove button
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(onRemoveIntake).toHaveBeenCalled();
  });
});
