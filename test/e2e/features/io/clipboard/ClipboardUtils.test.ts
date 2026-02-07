import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isInputFocused, tryGetImageFromClipboard, tryGetTextFromClipboard } from '~/features/io/clipboard/ClipboardUtils';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

describe('io/clipboard/ClipboardUtils (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    document.body.innerHTML = '';
  });

  it('isInputFocused returns true for input-like active element', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(isInputFocused()).toBe(true);
  });

  it('isInputFocused returns true for contenteditable active element', () => {
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    document.body.appendChild(editable);
    editable.focus();

    expect(isInputFocused()).toBe(true);
  });

  it('tryGetImageFromClipboard reads image buffer and closes source image', async () => {
    const close = vi.fn();
    platform.clipboard.readImage = vi.fn(async () => ({
      rgba: async () => new Uint8Array([1, 2, 3, 4]),
      size: async () => ({ width: 2, height: 2 }),
      close,
    })) as any;

    const result = await tryGetImageFromClipboard();

    expect(result).toEqual({
      buffer: new Uint8Array([1, 2, 3, 4]),
      width: 2,
      height: 2,
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('tryGetImageFromClipboard returns undefined on failure', async () => {
    platform.clipboard.readImage = vi.fn(async () => {
      throw new Error('clipboard read failed');
    }) as any;

    const result = await tryGetImageFromClipboard();

    expect(result).toBeUndefined();
  });

  it('tryGetTextFromClipboard returns clipboard text', async () => {
    platform.clipboard.readText = vi.fn(async () => 'layer-id-1') as any;

    await expect(tryGetTextFromClipboard()).resolves.toBe('layer-id-1');
  });

  it('tryGetTextFromClipboard returns undefined on failure', async () => {
    platform.clipboard.readText = vi.fn(async () => {
      throw new Error('clipboard text failed');
    }) as any;

    const result = await tryGetTextFromClipboard();

    expect(result).toBeUndefined();
  });
});
