import { beforeEach, describe, it } from 'vitest';
import { currentColor, PaletteType, setPaletteColor } from '~/features/color';
import { ColorHistoryAction } from '~/features/history';
import { BLACK, RED } from '../../../support/colors';
import { HistoryActionTester } from '../../../support/HistoryActionTester';
import { projectFixture } from '../../../support/projectFixture';
import '../mocks';
import { expect, TEST_CONSTANTS } from '../utils';

describe('ColorHistoryAction', () => {
  beforeEach(() => {
    projectFixture().withCanvas(TEST_CONSTANTS.CANVAS_SIZE).withPalette(PaletteType.primary, BLACK).clearHistory(true).apply();
  });

  it('undo/redo applies palette color', () => {
    const tester = new HistoryActionTester(
      () =>
        new ColorHistoryAction({
          palette: PaletteType.primary,
          oldColor: BLACK,
          newColor: RED,
          context: { from: TEST_CONSTANTS.CONTEXT },
        })
    );

    tester.run({
      apply: () => setPaletteColor(PaletteType.primary, RED),
      assertAfterApply: () => expect(currentColor()).toStrictEqual(RED),
      assertAfterUndo: () => expect(currentColor()).toStrictEqual(BLACK),
    });
  });
});
