import React from 'react';
import { Modal } from './Modal';

export const AddIntakeModal = ({ onClose, children, darkMode = false }) => {
  return (
    <Modal
      title="Add Caffeine Intake"
      onClose={onClose}
      darkMode={darkMode}
      panelClassName="rounded-2xl sm:rounded-glass"
    >
      {children}
    </Modal>
  );
};
