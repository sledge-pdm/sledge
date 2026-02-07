import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearBottomBarTextTimer,
  getPersistentBottomBarText,
  resetBottomBarText,
  setBottomBarText,
  setBottomBarTextPermanent,
} from '~/features/log/bottomBar';
import { logStore, setLogStore, setToolStore } from '~/stores/EditorStores';

describe('features/log/bottomBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearBottomBarTextTimer();
    setToolStore('activeToolCategory', 'pen');
    setLogStore('bottomBarText', '');
    setLogStore('bottomBarKind', 'info');
  });

  afterEach(() => {
    clearBottomBarTextTimer();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('returns persistent guide text for each tool category group', () => {
    setToolStore('activeToolCategory', 'pen');
    expect(getPersistentBottomBarText()).toBe('line: shift+drag (ctrl to snap) / rotate: shift+wheel');

    setToolStore('activeToolCategory', 'rectSelection');
    expect(getPersistentBottomBarText()).toBe('add: shift+drag / subtract: alt+drag / move: ctrl+drag');

    setToolStore('activeToolCategory', 'autoSelection');
    expect(getPersistentBottomBarText()).toBe('add: shift+drag / subtract: alt+drag / move: ctrl+drag');

    setToolStore('activeToolCategory', 'lassoSelection');
    expect(getPersistentBottomBarText()).toBe('add: shift+drag / subtract: alt+drag / move: ctrl+drag');

    setToolStore('activeToolCategory', 'pipette');
    expect(getPersistentBottomBarText()).toBe('continuous pick: shift+click');

    setToolStore('activeToolCategory', 'move');
    expect(getPersistentBottomBarText()).toBe('rotate: shift+wheel / drag: ctrl+drag');
  });

  it('resets temporary text to persistent text after duration', () => {
    setBottomBarText('working', { kind: 'warn', duration: 200 });

    expect(logStore.bottomBarText).toBe('working');
    expect(logStore.bottomBarKind).toBe('warn');

    vi.advanceTimersByTime(199);
    expect(logStore.bottomBarText).toBe('working');
    expect(logStore.bottomBarKind).toBe('warn');

    vi.advanceTimersByTime(1);
    expect(logStore.bottomBarText).toBe('line: shift+drag (ctrl to snap) / rotate: shift+wheel');
    expect(logStore.bottomBarKind).toBe('persistent');
  });

  it('does not schedule auto-reset when text is already persistent', () => {
    const persistent = getPersistentBottomBarText();

    setBottomBarText(persistent, { kind: 'warn', duration: 50 });
    vi.advanceTimersByTime(1000);

    expect(logStore.bottomBarText).toBe(persistent);
    expect(logStore.bottomBarKind).toBe('warn');
  });

  it('clearBottomBarTextTimer cancels pending reset', () => {
    setBottomBarText('temporary', { duration: 100 });

    clearBottomBarTextTimer();
    vi.advanceTimersByTime(1000);

    expect(logStore.bottomBarText).toBe('temporary');
    expect(logStore.bottomBarKind).toBe('info');
  });

  it('setBottomBarTextPermanent clears timer and keeps permanent message', () => {
    setBottomBarText('temporary', { duration: 100 });
    setBottomBarTextPermanent('locked', { kind: 'error' });
    vi.advanceTimersByTime(1000);

    expect(logStore.bottomBarText).toBe('locked');
    expect(logStore.bottomBarKind).toBe('error');
  });

  it('resetBottomBarText applies persistent kind and message for current tool', () => {
    setToolStore('activeToolCategory', 'pipette');
    resetBottomBarText();

    expect(logStore.bottomBarText).toBe('continuous pick: shift+click');
    expect(logStore.bottomBarKind).toBe('persistent');
  });
});
