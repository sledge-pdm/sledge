import { RGBA } from '@sledge/anvil';
import { PaletteType, setPaletteColor } from '~/features/color';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

export interface ColorHistoryActionProps extends BaseHistoryActionProps {
  palette: PaletteType;
  oldColor: RGBA;
  newColor: RGBA;
}

// history action for color change in palette
export class ColorHistoryAction extends BaseHistoryAction {
  readonly type = 'color' as const;

  palette: PaletteType;
  oldColor: RGBA;
  newColor: RGBA;

  constructor(public readonly props: ColorHistoryActionProps) {
    super(props);
    this.palette = props.palette;
    this.oldColor = props.oldColor;
    this.newColor = props.newColor;
  }

  undo(): void {
    setPaletteColor(this.palette, this.oldColor);
  }

  redo(): void {
    setPaletteColor(this.palette, this.newColor);
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
