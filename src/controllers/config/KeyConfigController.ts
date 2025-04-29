import { reconcile } from 'solid-js/store';
import { makeDefaultKeyConfigStore, setKeyConfigStore } from '~/stores/GlobalStores';
import { KeyConfigEntry } from '~/types/KeyConfig';

export const recordKey = (e: KeyboardEvent): KeyConfigEntry => {
  return {
    key: e.key,
    ctrl: e.ctrlKey || undefined,
    shift: e.shiftKey || undefined,
    alt: e.altKey || undefined,
    meta: e.metaKey || undefined,
  };
};

export function isRecordEndSave(e: KeyboardEvent): boolean {
  return e.key.toLowerCase() === 'enter';
}

export function isRecordEndWithoutSave(e: KeyboardEvent): boolean {
  return e.key.toLowerCase() === 'escape';
}

const modifierKeys = ['control', 'shift', 'alt', 'meta'];

export function isRecordPossible(e: KeyboardEvent): boolean {
  // space.
  if (e.key === ' ') return false;
  // just ctrl etc. without key.
  if (modifierKeys.includes(e.key.toLowerCase())) return false;

  return true;
}

export const parseKeyConfigEntry = (entry?: KeyConfigEntry) => {
  if (!entry) return undefined;
  return [
    entry.ctrl ? 'ctrl' : '',
    entry.shift ? 'shift' : '',
    entry.alt ? 'alt' : '',
    entry.meta ? 'meta' : '',
    entry.key,
  ]
    .filter((t) => t !== '')
    .join('+');
};

export function saveKeyConfigEntry(name: string, entry?: KeyConfigEntry) {
  if (!entry) return;
  setKeyConfigStore(name, 0, entry);
}

export function restoreDefaultKeyConfig() {
  setKeyConfigStore(reconcile(makeDefaultKeyConfigStore()));
}
