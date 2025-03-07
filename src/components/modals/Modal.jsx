import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ title, onClose, children, darkMode = false }) => {
  const modalRef = useRef(null);
  
  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Close on escape key
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scrolling while modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Clean up event listeners and restore body scrolling
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);
  
  // Handle clicking outside modal to close it
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex justify-between items-center p-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-opacity-10 ${
              darkMode ? 'hover:bg-gray-400' : 'hover:bg-gray-200'
            }`}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}; 