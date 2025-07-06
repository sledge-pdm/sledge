'background-image';
import { style } from '@vanilla-extract/css';
import { flexRow } from '~/styles/snippets.css';

const transparent_bg_color = '#00000010';

export const canvasStack = style([
  flexRow,
  {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',

    backgroundImage:
      `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%),` +
      `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%)`,
  },
]);
