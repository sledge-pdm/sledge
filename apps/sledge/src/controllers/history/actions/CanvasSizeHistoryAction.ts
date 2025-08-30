import { Size2D } from '@sledge/core';
import { changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';

// history action for layer property changes (e.g. name, opacity, etc.)
export class CanvasSizeHistoryAction extends BaseHistoryAction {
  readonly type = 'canvas_size' as const;

  constructor(
    public readonly oldSize: Size2D,
    public readonly newSize: Size2D,
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    // incomplete because it won't restore the parts that cut out in resize
    // changeCanvasSize emits 'canvas:sizeChanged' event itself!
    changeCanvasSize(this.oldSize);
  }

  redo(): void {
    // incomplete because it won't restore the parts that cut out in resize
    changeCanvasSize(this.newSize);
  }
}
