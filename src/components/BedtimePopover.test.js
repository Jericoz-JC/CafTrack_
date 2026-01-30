import { render, screen, fireEvent } from '@testing-library/react';
import { BedtimePopover } from './BedtimePopover';

describe('BedtimePopover', () => {
  test('opens and closes the popover', () => {
    render(
      <BedtimePopover
        sleepTime="22:00"
        onSleepTimeChange={jest.fn()}
        caffeineAtSleep={40}
        targetLevel={30}
        isReadyForSleep={false}
      />
    );

    const trigger = screen.getByRole('button', { name: /bedtime:/i });
    fireEvent.click(trigger);

    expect(screen.getByText(/set bedtime/i)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText(/set bedtime/i)).not.toBeInTheDocument();
  });

  test('updates custom time', () => {
    const handleChange = jest.fn();

    render(
      <BedtimePopover
        sleepTime="22:00"
        onSleepTimeChange={handleChange}
        caffeineAtSleep={20}
        targetLevel={30}
        isReadyForSleep={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /bedtime:/i }));

    const timeInput = screen.getByDisplayValue('22:00');
    fireEvent.change(timeInput, { target: { value: '23:30' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('23:30');
  });
});
