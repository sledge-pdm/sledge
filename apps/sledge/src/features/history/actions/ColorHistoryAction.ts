import { PaletteType, RGBAColor, RGBAToHex, setColor } from '~/features/color';
import { BaseHistoryAction } from '~/features/history';

// history action for color change in palette
export class ColorHistoryAction extends BaseHistoryAction {
  readonly type = 'color' as const;

  constructor(
    public readonly palette: PaletteType,
    public readonly oldColor: RGBAColor,
    public readonly newColor: RGBAColor,
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    setColor(this.palette, `#${RGBAToHex(this.oldColor, true)}`);
  }

  redo(): void {
    setColor(this.palette, `#${RGBAToHex(this.newColor, true)}`);
  }
}
