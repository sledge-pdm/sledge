import { RGBA, RGBAToHex } from '@sledge-pdm/core';
import { PaletteType, setPaletteColor } from '~/features/color';
import { HistoryContext } from '~/features/history/types';
import { HistoryCommand } from '../HistoryCommand';

export interface ColorChangeCommandProps {
  palette: PaletteType;
  oldColor: RGBA;
  newColor: RGBA;
}

export class ColorChangeCommand extends HistoryCommand {
  private palette: PaletteType;
  private oldColor: RGBA;
  private newColor: RGBA;

  constructor(props: ColorChangeCommandProps) {
    super('color');
    this.palette = props.palette;
    this.oldColor = props.oldColor;
    this.newColor = props.newColor;
  }

  forward(): void {
    setPaletteColor(this.palette, this.newColor);
  }

  backward(): void {
    setPaletteColor(this.palette, this.oldColor);
  }

  getContext(): HistoryContext {
    const oldHex = `#${RGBAToHex(this.oldColor)}`;
    const newHex = `#${RGBAToHex(this.newColor)}`;
    return { icon: '/assets/icons/actions/color_change.png', description: `${oldHex} -> ${newHex}` };
  }
}
