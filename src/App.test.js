import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CafTrack header', () => {
  render(<App />);
  const heading = screen.getByText(/caftrack/i);
  expect(heading).toBeInTheDocument();
});
