import { render, screen } from '@testing-library/react';
import CaffeineCalculator from './CaffeineCalculator';

const mockMatchMedia = (matches) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  });
};

describe('CaffeineCalculator responsive layout', () => {
  afterEach(() => {
    window.matchMedia = undefined;
  });

  test('renders mobile navigation under lg breakpoint', () => {
    mockMatchMedia(false);

    render(<CaffeineCalculator />);

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/desktop dashboard/i)).not.toBeInTheDocument();
  });

  test('renders desktop dashboard at lg breakpoint', () => {
    mockMatchMedia(true);

    render(<CaffeineCalculator />);

    expect(screen.getByLabelText(/desktop dashboard/i)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /primary/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /add intake/i })).toBeInTheDocument();
  });
});
