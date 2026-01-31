import { renderHook, act } from '@testing-library/react';
import { useUndoState } from './useUndoState';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useUndoState', () => {
  test('starts with null undoState', () => {
    const { result } = renderHook(() => useUndoState());
    expect(result.current.undoState).toBeNull();
  });

  test('setUndoState updates the state', () => {
    const { result } = renderHook(() => useUndoState());

    act(() => {
      result.current.setUndoState({ intake: { id: '1', name: 'Coffee' }, index: 0 });
    });

    expect(result.current.undoState).toEqual({ intake: { id: '1', name: 'Coffee' }, index: 0 });
  });

  test('handleUndo calls onUndo callback and clears state', () => {
    const onUndo = jest.fn();
    const { result } = renderHook(() => useUndoState({ onUndo }));

    act(() => {
      result.current.setUndoState({ intake: { id: '1', name: 'Coffee' }, index: 0 });
    });

    act(() => {
      result.current.handleUndo();
    });

    expect(onUndo).toHaveBeenCalledWith({ intake: { id: '1', name: 'Coffee' }, index: 0 });
    expect(result.current.undoState).toBeNull();
  });

  test('handleUndo does nothing when undoState is null', () => {
    const onUndo = jest.fn();
    const { result } = renderHook(() => useUndoState({ onUndo }));

    act(() => {
      result.current.handleUndo();
    });

    expect(onUndo).not.toHaveBeenCalled();
  });

  test('dismissUndo clears the state', () => {
    const { result } = renderHook(() => useUndoState());

    act(() => {
      result.current.setUndoState({ intake: { id: '1', name: 'Coffee' }, index: 0 });
    });

    act(() => {
      result.current.dismissUndo();
    });

    expect(result.current.undoState).toBeNull();
  });

  test('auto-clears after timeout', () => {
    const { result } = renderHook(() => useUndoState({ timeoutMs: 3000 }));

    act(() => {
      result.current.setUndoState({ intake: { id: '1', name: 'Coffee' }, index: 0 });
    });

    expect(result.current.undoState).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.undoState).toBeNull();
  });

  test('uses default 5000ms timeout', () => {
    const { result } = renderHook(() => useUndoState());

    act(() => {
      result.current.setUndoState({ intake: { id: '1', name: 'Coffee' }, index: 0 });
    });

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(result.current.undoState).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.undoState).toBeNull();
  });
});
