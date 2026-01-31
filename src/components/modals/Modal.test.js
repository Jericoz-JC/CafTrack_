import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  test('renders title and content', () => {
    const handleClose = jest.fn();

    render(
      <Modal title="Test Modal" onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('clicking the overlay closes the modal', () => {
    const handleClose = jest.fn();
    render(
      <Modal title="Overlay" onClose={handleClose}>
        <p>Body</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement;
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('pressing Escape closes the modal', () => {
    const handleClose = jest.fn();

    render(
      <Modal title="Escape" onClose={handleClose}>
        <p>Body</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
