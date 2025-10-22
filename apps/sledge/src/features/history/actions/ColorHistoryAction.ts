import { PaletteType, RGBAColor, RGBAToHex, setColor } from '~/features/color';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface ColorHistoryActionProps extends BaseHistoryActionProps {
  palette: PaletteType;
  oldColor: RGBAColor;
  newColor: RGBAColor;
}

// history action for color change in palette
export class ColorHistoryAction extends BaseHistoryAction {
  readonly type = 'color' as const;

  palette: PaletteType;
  oldColor: RGBAColor;
  newColor: RGBAColor;

  constructor(public readonly props: ColorHistoryActionProps) {
    super(props);
    this.palette = props.palette;
    this.oldColor = props.oldColor;
    this.newColor = props.newColor;
  }

  undo(): void {
    setColor(this.palette, `#${RGBAToHex(this.oldColor, true)}`);
  }

  redo(): void {
    setColor(this.palette, `#${RGBAToHex(this.newColor, true)}`);
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        palette: this.palette,
        oldColor: this.oldColor,
        newColor: this.newColor,
      } as ColorHistoryActionProps,
    };
  }
}
