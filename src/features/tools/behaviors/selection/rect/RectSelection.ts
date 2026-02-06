import { doCommands } from '~/features/history';
import { SelectionChangeCommand } from '~/features/history/command/selection/SelectionChangeCommand';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { ToolArgs } from '~/features/tools/behaviors/ToolBehavior';
import { SelectionBase } from '~/features/tools/behaviors/selection/SelectionBase';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { SelectionEditMode } from '~/stores/editor/InteractStore';

export class RectSelection extends SelectionBase {
  private baseMaskSnapshot: Uint8Array | undefined;
  private width = 0;
  private height = 0;

  protected onStartSelection(args: ToolArgs, mode: SelectionEditMode) {
    this.startPosition = args.position;
    const back = selectionManager.getBack();
    if (back) {
      this.width = back.getWidth();
      this.height = back.getHeight();
      this.baseMaskSnapshot = new Uint8Array(back.getMask());
    } else {
      const width = projectStore.canvas.size.width ?? 0;
      const height = projectStore.canvas.size.height ?? 0;
      this.width = width;
      this.height = height;
      this.baseMaskSnapshot = undefined;
    }
    if (this.width === 0 || this.height === 0) return;
    this.applyRectToSelection(args.position, mode);
  }

  protected onMoveSelection(args: ToolArgs, mode: SelectionEditMode) {
    this.applyRectToSelection(args.position, mode);
  }

  protected onEndSelection(args: ToolArgs, mode: SelectionEditMode) {
    doCommands(
      new SelectionChangeCommand({
        swapBack: selectionManager.getFront(),
      })
    );
    this.baseMaskSnapshot = undefined;
  }

  protected onCancelSelection(args: ToolArgs, mode: SelectionEditMode) {
    selectionManager.clearFront();
    this.baseMaskSnapshot = undefined;
  }

  private applyRectToSelection(position: { x: number; y: number }, mode: SelectionEditMode) {
    if (this.width === 0 || this.height === 0) return;

    let base: Uint8Array;
    if (mode === 'replace') {
      base = new Uint8Array(this.width * this.height);
    } else if (this.baseMaskSnapshot) {
      base = new Uint8Array(this.baseMaskSnapshot);
    } else {
      base = new Uint8Array(this.width * this.height);
    }

    const sx = Math.max(0, Math.min(this.width - 1, Math.floor(this.startPosition.x)));
    const sy = Math.max(0, Math.min(this.height - 1, Math.floor(this.startPosition.y)));
    const px = Math.max(0, Math.min(this.width - 1, Math.floor(position.x)));
    const py = Math.max(0, Math.min(this.height - 1, Math.floor(position.y)));

    const x0 = Math.min(sx, px);
    const y0 = Math.min(sy, py);
    const x1 = Math.max(sx, px);
    const y1 = Math.max(sy, py);

    const writeValue: 0 | 1 = mode === 'subtract' ? 0 : 1;
    for (let y = y0; y <= y1; y++) {
      const row = y * this.width;
      for (let x = x0; x <= x1; x++) {
        base[row + x] = writeValue;
      }
    }

    const front = new SelectionMask(this.width, this.height);
    front.setMask(base);
    selectionManager.setFront(front);
  }
}
