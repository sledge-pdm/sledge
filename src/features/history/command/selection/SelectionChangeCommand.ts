import { HistoryContext } from '~/features/history/types';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { HistoryCommand } from '../HistoryCommand';

export interface SelectionChangeCommandProps {
  swapBack: SelectionMask | undefined;
}

export class ApplySelectionFrontToBackCommand extends HistoryCommand {
  private swapBack: SelectionMask | undefined;

  constructor(props: SelectionChangeCommandProps) {
    super('selection_change');
    this.swapBack = props.swapBack;
  }

  forward(): void {
    this.swap();
  }

  backward(): void {
    this.swap();
  }

  private swap(): void {
    const current = selectionManager.getBack();
    selectionManager.setBack(this.swapBack);
    selectionManager.clearFront();
    this.swapBack = current;
  }

  getContext(): HistoryContext {
    return { icon: '/assets/icons/actions/layer.png', description: 'selection change' };
  }

  serializeProps(): SelectionChangeCommandProps {
    return { swapBack: this.swapBack };
  }
}
