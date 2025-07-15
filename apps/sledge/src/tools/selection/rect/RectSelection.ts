import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { RectFragment, SelectionEditMode, selectionManager } from '~/controllers/selection/SelectionManager';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

export class RectSelection implements ToolBehavior {
  onlyOnCanvas = false;

  private startPosition: Vec2 = { x: 0, y: 0 };

  getMode(e?: PointerEvent) {
    const isShiftPressed = e?.shiftKey;
    const isAltPressed = e?.altKey;
    let mode: SelectionEditMode = 'replace';
    if (isShiftPressed) mode = 'add';
    if (isAltPressed) mode = 'subtract';
    return mode;
  }

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    selectionManager.beginPreview(this.getMode(args.event));
    this.startPosition = args.position;
    const newRect: RectFragment = {
      kind: 'rect',
      startPosition: this.startPosition,
      width: 1,
      height: 1,
    };
    selectionManager.setPreviewFragment(newRect);

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    selectionManager.beginPreview(this.getMode(args.event));

    const px = Math.max(0, args.position.x);
    const py = Math.max(0, args.position.y);
    const sx = Math.max(0, this.startPosition.x);
    const sy = Math.max(0, this.startPosition.y);

    const newRect: RectFragment = {
      kind: 'rect',
      startPosition: { x: 0, y: 0 },
      width: 0,
      height: 0,
    };
    const x0 = Math.min(sx, px);
    const y0 = Math.min(sy, py);
    newRect.startPosition.x = x0;
    newRect.startPosition.y = y0;
    newRect.width = Math.abs(px - sx) + 1;
    newRect.height = Math.abs(py - sy) + 1;

    console.log(newRect);

    selectionManager.setPreviewFragment(newRect);
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    selectionManager.commit();
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
