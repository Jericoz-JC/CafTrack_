import { render, screen, fireEvent } from '@testing-library/react';
import { AddIntakeForm } from './AddIntakeForm';

jest.mock('../../hooks/useDrinkDatabase', () => ({
  RECENT_DRINK_STORAGE_KEY: 'caftrack_recent_drinks',
  getCategoryLabel: (category) => category,
  useDrinkDatabase: () => ({
    drinks: [],
    drinksById: new Map(),
    loading: false,
    error: null
  })
}));

const ensureScrollIntoView = () => {
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  }
};

describe('AddIntakeForm', () => {
  beforeAll(() => {
    ensureScrollIntoView();
  });

  test('switches time modes and uses custom date/time', () => {
    const handleAdd = jest.fn();

    render(<AddIntakeForm onAdd={handleAdd} />);

    fireEvent.click(screen.getByRole('button', { name: /pick exact time/i }));

    const dateInput = screen.getByLabelText(/date/i);
    const timeInput = screen.getByLabelText(/time/i);

    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    fireEvent.change(timeInput, { target: { value: '21:30' } });

    fireEvent.click(screen.getByRole('button', { name: /add custom drink/i }));

    fireEvent.change(screen.getByLabelText(/drink name/i), {
      target: { value: 'Test drink' }
    });
    fireEvent.change(screen.getByLabelText(/caffeine amount/i), {
      target: { value: '120' }
    });

    fireEvent.click(screen.getByRole('button', { name: /log custom drink/i }));

    expect(handleAdd).toHaveBeenCalledTimes(1);

    const payload = handleAdd.mock.calls[0][0];
    const expectedTimestamp = new Date(2025, 0, 15, 21, 30, 0, 0).toISOString();

    expect(payload).toMatchObject({
      name: 'Test drink',
      amount: 120,
      category: 'custom'
    });
    expect(payload.timestamp).toBe(expectedTimestamp);
  });
});
