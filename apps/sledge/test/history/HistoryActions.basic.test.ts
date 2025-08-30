import { beforeEach, describe, expect, it } from 'vitest';
import { getEntry, insertEntry, removeEntry } from '~/controllers/canvas/image_pool/ImagePoolController';
import { currentColor, selectPalette, setColor } from '~/controllers/color/ColorController';
import { CanvasSizeHistoryAction } from '~/controllers/history/actions/CanvasSizeHistoryAction';
import { ColorHistoryAction } from '~/controllers/history/actions/ColorHistoryAction';
import { ImagePoolHistoryAction } from '~/controllers/history/actions/ImagePoolHistoryAction';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { PaletteType } from '~/models/color/PaletteType';
import { canvasStore } from '~/stores/ProjectStores';

describe('HistoryActions basic undo/redo', () => {
  describe('ColorHistoryAction', () => {
    beforeEach(() => {
      selectPalette(PaletteType.primary);
      setColor(PaletteType.primary, '#000000');
    });
    it('undo/redo applies palette color', () => {
      const act = new ColorHistoryAction(PaletteType.primary, [0, 0, 0, 255], [255, 0, 0, 255], { from: 'test' });
      act.redo();
      expect(currentColor()).toBe('#ff0000');
      act.undo();
      expect(currentColor()).toBe('#000000');
    });
  });

  describe('CanvasSizeHistoryAction', () => {
    it('undo/redo updates canvas size value', () => {
      const oldSize = { width: 100, height: 80 } as const;
      const newSize = { width: 120, height: 90 } as const;
      // set initial
      // Directly mutate store is avoided; rely on controller inside action.
      const act = new CanvasSizeHistoryAction(oldSize, newSize, { from: 'test' });
      act.redo();
      expect(canvasStore.canvas.width).toBe(newSize.width);
      expect(canvasStore.canvas.height).toBe(newSize.height);
      act.undo();
      expect(canvasStore.canvas.width).toBe(oldSize.width);
      expect(canvasStore.canvas.height).toBe(oldSize.height);
    });
  });

  describe('ImagePoolHistoryAction', () => {
    it('undo/redo add/remove keeps id with insertEntry()', async () => {
      const entry: ImagePoolEntry = {
        id: 'fixed-id',
        originalPath: 'C:/dummy.png',
        resourcePath: 'C:/dummy.png',
        fileName: 'dummy.png',
        x: 0,
        y: 0,
        scale: 1,
        width: 10,
        height: 10,
        opacity: 1,
        visible: true,
      };
      insertEntry(entry);
      const removeAction = new ImagePoolHistoryAction('remove', entry, { from: 'test' });
      removeAction.redo();
      expect(getEntry('fixed-id')).toBeUndefined();
      removeAction.undo();
      expect(getEntry('fixed-id')).toBeDefined();

      const addAction = new ImagePoolHistoryAction('add', entry, { from: 'test' });
      addAction.undo();
      expect(getEntry('fixed-id')).toBeUndefined();
      addAction.redo();
      expect(getEntry('fixed-id')).toBeDefined();

      // cleanup
      removeEntry('fixed-id');
    });
  });
});
