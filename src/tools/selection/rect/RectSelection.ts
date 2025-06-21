import LayerImageAgent from '~/controllers/layer/image/managers/LayerImageAgent';
import { RectFragment, SelectionEditMode, selectionManager } from '~/controllers/selection/SelectionManager';
import { Vec2 } from '~/models/types/Vector';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

export class RectSelection implements ToolBehavior {
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
    return false;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    selectionManager.beginPreview(this.getMode(args.event));

    const { x: px, y: py } = args.position;
    const { x: sx, y: sy } = this.startPosition;

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

    selectionManager.setPreviewFragment(newRect);
    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    selectionManager.commit();
    return false;
  }
}
