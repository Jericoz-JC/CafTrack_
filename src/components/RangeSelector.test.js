import { render, screen, fireEvent } from '@testing-library/react';
import { RangeSelector } from './RangeSelector';

describe('RangeSelector', () => {
  test('active selection updates UI', () => {
    const handleChange = jest.fn();
    const options = [
      { label: '24h', value: '24h' },
      { label: '7d', value: '7d' }
    ];

    render(
      <RangeSelector
        title="History Range"
        value="24h"
        onChange={handleChange}
        options={options}
      />
    );

    const dayButton = screen.getByRole('button', { name: '24h' });
    const weekButton = screen.getByRole('button', { name: '7d' });

    expect(dayButton).toHaveAttribute('aria-pressed', 'true');
    expect(weekButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(weekButton);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('7d');
  });
});
