import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  isKeyMatchesToEntry,
  isRecordEndSave,
  isRecordEndWithoutSave,
  isRecordPossible,
  parseKeyConfigEntry,
  recordKey,
} from '~/features/config/KeyConfigController';

class KeyboardEventStub {
  constructor(
    public key: string,
    public ctrlKey = false,
    public shiftKey = false,
    public altKey = false,
    public metaKey = false
  ) {}
}

class PointerEventStub {
  constructor(
    public ctrlKey = false,
    public shiftKey = false,
    public altKey = false,
    public metaKey = false
  ) {}
}

describe('KeyConfigController', () => {
  const originalKeyboardEvent = (globalThis as any).KeyboardEvent;
  const originalPointerEvent = (globalThis as any).PointerEvent;

  beforeAll(() => {
    (globalThis as any).KeyboardEvent = KeyboardEventStub;
    (globalThis as any).PointerEvent = PointerEventStub;
  });

  afterAll(() => {
    (globalThis as any).KeyboardEvent = originalKeyboardEvent;
    (globalThis as any).PointerEvent = originalPointerEvent;
  });

  it('recordKey stores key and modifier states', () => {
    const e = new KeyboardEventStub('K', true, false, true, false) as unknown as KeyboardEvent;
    expect(recordKey(e)).toEqual({
      key: 'K',
      ctrl: true,
      shift: undefined,
      alt: true,
      meta: undefined,
    });
  });

  it('detects record-end keys', () => {
    expect(isRecordEndSave(new KeyboardEventStub('Enter') as unknown as KeyboardEvent)).toBe(true);
    expect(isRecordEndWithoutSave(new KeyboardEventStub('Escape') as unknown as KeyboardEvent)).toBe(true);
  });

  it('isRecordPossible rejects space and modifier-only keys', () => {
    expect(isRecordPossible(new KeyboardEventStub(' ') as unknown as KeyboardEvent)).toBe(false);
    expect(isRecordPossible(new KeyboardEventStub('Control') as unknown as KeyboardEvent)).toBe(false);
    expect(isRecordPossible(new KeyboardEventStub('a') as unknown as KeyboardEvent)).toBe(true);
  });

  it('parseKeyConfigEntry formats modifiers and key', () => {
    expect(parseKeyConfigEntry({ ctrl: true, shift: true, key: 'S' })).toBe('ctrl+shift+S');
    expect(parseKeyConfigEntry(undefined)).toBeUndefined();
  });

  it('isKeyMatchesToEntry matches keyboard and pointer modifiers', () => {
    const entries = [{ ctrl: true, shift: true, key: 'z' }];
    const matchedKeyboard = new KeyboardEventStub('Z', true, true, false, false) as unknown as KeyboardEvent;
    const unmatchedKeyboard = new KeyboardEventStub('X', true, true, false, false) as unknown as KeyboardEvent;

    expect(isKeyMatchesToEntry(matchedKeyboard, entries)).toBe(true);
    expect(isKeyMatchesToEntry(unmatchedKeyboard, entries)).toBe(false);

    const pointerEntries = [{ ctrl: false, alt: true, shift: false, meta: false }];
    const matchedPointer = new PointerEventStub(false, false, true, false) as unknown as PointerEvent;
    expect(isKeyMatchesToEntry(matchedPointer, pointerEntries)).toBe(true);
  });
});
