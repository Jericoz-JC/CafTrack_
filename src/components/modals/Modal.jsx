import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ title, onClose, children, darkMode = false }) => {
  const modalRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    scrollPositionRef.current = window.scrollY || window.pageYOffset || 0;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [onClose]);
  
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  const frameStyles = darkMode
    ? 'bg-gray-900 text-white border-gray-800'
    : 'bg-white text-gray-900 border-gray-100';
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto rounded-[32px] shadow-2xl border overflow-hidden ${frameStyles}`}
      >
        <div className="max-h-[85vh] flex flex-col">
          <div className={`flex justify-between items-center px-5 sm:px-7 py-4 border-b ${
            darkMode ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <h2 className="text-xl font-bold">{title}</h2>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors ${
                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="px-5 sm:px-7 py-5 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};