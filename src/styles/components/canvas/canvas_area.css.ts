import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { flexCol } from '../../snippets.css';

export const canvasArea = style([
  flexCol,
  {
    backgroundColor: vars.color.bg_canvas_area,
    display: 'flex',
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
  },
]);
