import { useCallback, useEffect, useState } from 'react';

export const useUndoState = ({ onUndo, timeoutMs = 5000 } = {}) => {
  const [undoState, setUndoState] = useState(null);

  useEffect(() => {
    if (!undoState) return undefined;
    const timeoutId = window.setTimeout(() => {
      setUndoState(null);
    }, timeoutMs);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [undoState, timeoutMs]);

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    if (typeof onUndo === 'function') {
      onUndo(undoState);
    }
    setUndoState(null);
  }, [onUndo, undoState]);

  const dismissUndo = useCallback(() => {
    setUndoState(null);
  }, []);

  return { undoState, setUndoState, handleUndo, dismissUndo };
};
