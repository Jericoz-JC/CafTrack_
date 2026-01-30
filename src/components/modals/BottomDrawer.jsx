import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export const BottomDrawer = ({
  title,
  open,
  onClose,
  children,
  darkMode = false,
  heightClass = 'h-[60vh]'
}) => {
  const drawerRef = useRef(null);
  const titleId = useId();
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (!open) return undefined;

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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 glass-backdrop"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl border glass-surface-strong glass-highlight shadow-2xl overscroll-contain flex flex-col ${
          darkMode
            ? 'border-white/10 text-slate-100'
            : 'border-slate-200/80 text-slate-900'
        } ${heightClass}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-stroke">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode
                ? 'hover:bg-white/10 focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                : 'hover:bg-slate-900/5 focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
            aria-label="Close drawer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};
