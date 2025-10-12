import { reconcile } from 'solid-js/store';
import { KeyConfigCommands } from '~/Consts';
import { KeyConfigEntry } from '~/features/config/models/KeyConfig';
import { makeDefaultKeyConfigStore } from '~/stores/global/KeyConfigStore';
import { setKeyConfigStore } from '~/stores/GlobalStores';

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
  return [entry.ctrl ? 'ctrl' : '', entry.shift ? 'shift' : '', entry.alt ? 'alt' : '', entry.meta ? 'meta' : '', entry.key ?? '']
    .filter((t) => t !== '')
    .join('+');
};

export function saveKeyConfigEntry(name: KeyConfigCommands, entry?: KeyConfigEntry) {
  if (!entry) return;
  setKeyConfigStore(name, 0, entry);
}

export function restoreDefaultKeyConfig() {
  setKeyConfigStore(reconcile(makeDefaultKeyConfigStore()));
}

export function isKeyMatchesToEntry(e: KeyboardEvent | PointerEvent, entries: KeyConfigEntry[]): boolean {
  return entries.some((entry) => {
    if (e instanceof KeyboardEvent) {
      if (entry.key !== undefined && entry.key.toLowerCase() !== e.key?.toLowerCase()) return false;
    }

    if ((entry.ctrl ?? false) !== e.ctrlKey) return false;
    if ((entry.alt ?? false) !== e.altKey) return false;
    if ((entry.meta ?? false) !== e.metaKey) return false;
    if ((entry.shift ?? false) !== e.shiftKey) return false;
    return true;
  });
}
