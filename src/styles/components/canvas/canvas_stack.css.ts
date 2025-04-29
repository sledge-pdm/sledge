'background-image';
import { style } from '@vanilla-extract/css';
import { flexRow } from '~/styles/snippets.css';

const transparent_bg_size = 10;
const transparent_bg_color = '#0000000A';

export const canvasStack = style([
  flexRow,
  {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',

    backgroundImage:
      `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%),` +
      `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%)`,
    backgroundSize: `${transparent_bg_size * 2}px ${transparent_bg_size * 2}px`,
    backgroundPosition: `0 0, ${transparent_bg_size}px ${transparent_bg_size}px`,
  },
]);
