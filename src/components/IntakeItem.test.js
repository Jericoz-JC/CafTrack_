import { render, screen, fireEvent } from '@testing-library/react';
import { IntakeItem } from './IntakeItem';

describe('IntakeItem', () => {
  test('remove action fires', () => {
    const handleRemove = jest.fn();
    const intake = {
      id: 'intake-1',
      name: 'Cold Brew',
      amount: 120,
      timestamp: new Date().toISOString(),
      category: 'coffee'
    };

    render(
      <IntakeItem intake={intake} onRemove={handleRemove} />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(handleRemove).toHaveBeenCalledTimes(1);
    expect(handleRemove).toHaveBeenCalledWith('intake-1');
  });
});
