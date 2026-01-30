import React, { useId, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({
  title,
  onClose,
  children,
  darkMode = false,
  fullScreen = false,
  contentClassName,
  panelClassName
}) => {
  const modalRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const titleId = useId();
  
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
  
  const frameStyles = fullScreen
    ? darkMode
      ? 'bg-slate-950 text-slate-100'
      : 'bg-white text-slate-900'
    : darkMode
      ? 'glass-surface glass-highlight text-slate-100'
      : 'glass-surface glass-highlight text-slate-900';
  const overlayClass = fullScreen
    ? 'fixed inset-0 z-50 glass-backdrop overscroll-contain'
    : 'fixed inset-0 z-50 flex items-center justify-center glass-backdrop overscroll-contain p-4 sm:p-8';
  const panelSize = fullScreen
    ? 'absolute inset-0 w-full h-full max-w-none rounded-none'
    : 'w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto rounded-glass';
  const panelBody = fullScreen ? 'h-full flex flex-col' : 'max-h-[85vh] flex flex-col';
  const bodyClass =
    contentClassName ??
    (fullScreen ? 'px-6 py-6 overflow-y-auto flex-1' : 'px-5 sm:px-7 py-5 overflow-y-auto');
  
  const modalMarkup = (
    <div
      className={overlayClass}
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${panelSize} overflow-hidden ${frameStyles} ${panelClassName ?? ''}`}
      >
        <div className={panelBody}>
          <div className="flex justify-between items-center px-5 sm:px-7 py-4 border-b border-glass-stroke">
            <h2 id={titleId} className="text-xl font-bold">{title}</h2>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors ${
                darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-900/5'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                darkMode
                  ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                  : 'focus-visible:ring-sky-500 focus-visible:ring-offset-white'
              }`}
              aria-label="Close modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          
          <div className={bodyClass}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalMarkup;
  }

  return createPortal(modalMarkup, document.body);
};
