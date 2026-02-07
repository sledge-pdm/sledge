import { HistoryContext } from '@sledge-pdm/core';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { HistoryCommand } from '../HistoryCommand';
import { registerHistoryCommand } from '../registry';

// serializable interface for SelectionMask
interface SelectionMaskSnapshot {
  width: number;
  height: number;
  mask: Uint8Array;
}

export interface SelectionChangeCommandProps {
  swapBack?: SelectionMask | undefined;
  swapBackSnapshot?: SelectionMaskSnapshot | undefined;
}

export class ApplySelectionFrontToBackCommand extends HistoryCommand {
  private swapBackSnapshot: SelectionMaskSnapshot | undefined;

  constructor(props: SelectionChangeCommandProps) {
    super('selection_change');
    if (props.swapBack) {
      this.swapBackSnapshot = this.getSnapshot(props.swapBack);
    } else {
      this.swapBackSnapshot = props.swapBackSnapshot;
    }
  }

  getSnapshot(selectionMask: SelectionMask): SelectionMaskSnapshot {
    return {
      width: selectionMask.getWidth(),
      height: selectionMask.getHeight(),
      mask: new Uint8Array(selectionMask.getMask()),
    };
  }

  fromSnapshot(snapshot: SelectionMaskSnapshot): SelectionMask {
    const selection = new SelectionMask(snapshot.width, snapshot.height);
    selection.setMask(new Uint8Array(snapshot.mask));
    return selection;
  }

  forward(): void {
    this.swap();
  }

  backward(): void {
    this.swap();
  }

  private swap(): void {
    const current = selectionManager.getBack();
    selectionManager.setBack(this.swapBackSnapshot ? this.fromSnapshot(this.swapBackSnapshot) : undefined);
    selectionManager.clearFront();
    this.swapBackSnapshot = current ? this.getSnapshot(current) : undefined;
  }

  getContext(): HistoryContext {
    return { icon: '/assets/icons/actions/layer.png', description: 'selection change' };
  }

  serializeProps(): SelectionChangeCommandProps {
    return { swapBackSnapshot: this.swapBackSnapshot, swapBack: undefined };
  }
}

registerHistoryCommand('selection_change', (props) => new ApplySelectionFrontToBackCommand(props as SelectionChangeCommandProps));
