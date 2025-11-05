import { beforeEach, describe, it } from 'vitest';
import { currentColor, PaletteType } from '~/features/color';
import { ColorHistoryAction } from '~/features/history';
import './mocks';
import { expect, setupTestEnvironment, TEST_CONSTANTS } from './utils';

describe('ColorHistoryAction', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('undo/redo applies palette color', () => {
    const action = new ColorHistoryAction({
      palette: PaletteType.primary,
      oldColor: [0, 0, 0, 255],
      newColor: [255, 0, 0, 255],
      context: { from: TEST_CONSTANTS.CONTEXT },
    });

    action.redo();
    expect(currentColor()).toBe('#ff0000');

    action.undo();
    expect(currentColor()).toBe('#000000');
  });
});
