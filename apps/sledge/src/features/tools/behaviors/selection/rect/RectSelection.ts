import { RectFragment, selectionManager } from '~/features/selection/SelectionAreaManager';
import { ToolArgs } from '~/features/tools/behaviors/ToolBehavior';
import { SelectionBase } from '~/features/tools/behaviors/selection/SelectionBase';
import { SelectionEditMode } from '~/stores/editor/InteractStore';

export class RectSelection extends SelectionBase {
  protected onStartSelection(args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.beginPreview(mode);
    this.startPosition = args.position;
    const newRect: RectFragment = {
      kind: 'rect',
      startPosition: this.startPosition,
      width: 1,
      height: 1,
    };
    selectionManager.setPreviewFragment(newRect);
  }

  protected onMoveSelection(args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.updatePreview();

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

    selectionManager.setPreviewFragment(newRect);
  }

  protected onEndSelection(args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.commit();
  }

  protected onCancelSelection(args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.commit();
  }
}
