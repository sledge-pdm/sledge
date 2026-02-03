import { HistoryContext } from '~/features/history/types';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { HistoryCommand } from '../HistoryCommand';

export interface SelectionChangeCommandProps {
  beforeBack: SelectionMask | undefined;
  afterBack: SelectionMask | undefined;
}

// NOTE: This command tracks only "back" (committed) selectionMask.
export class SelectionChangeCommand extends HistoryCommand {
  private beforeBack: SelectionMask | undefined;
  private afterBack: SelectionMask | undefined;

  constructor(props: SelectionChangeCommandProps) {
    super('selection_change');
    this.beforeBack = normalizeClone(props.beforeBack);
    this.afterBack = normalizeClone(props.afterBack);
  }

  forward(): void {
    this.apply(this.afterBack);
  }

  backward(): void {
    this.apply(this.beforeBack);
  }

  private apply(mask: SelectionMask | undefined): void {
    selectionManager.setBack(mask);
    selectionManager.clearFront();
  }

  getContext(): HistoryContext {
    return { icon: '/assets/icons/actions/layer.png', description: 'selection change' };
  }

  serializeProps(): SelectionChangeCommandProps {
    return { beforeBack: normalizeClone(this.beforeBack), afterBack: normalizeClone(this.afterBack) };
  }
}

const normalizeClone = (mask: SelectionMask | undefined): SelectionMask | undefined => {
  if (!mask) return undefined;
  if (mask.isCleared()) return undefined;
  const cloned = new SelectionMask(mask.getWidth(), mask.getHeight());
  cloned.setMask(new Uint8Array(mask.getMask()));
  return cloned;
};
