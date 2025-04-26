import { style } from '@vanilla-extract/css';
import { vars } from '../global.css';
import { flexRow, w100 } from '../snippets.css';

export const bottomInfoRoot = style([
  flexRow,
  w100,
  {
    position: 'fixed',
    backgroundColor: vars.color.bg,
    borderTop: '1px solid #aaa',
    height: '20px',
    alignItems: 'center',
    padding: `0 ${vars.spacing.md}`,
    margin: 0,
    bottom: 0,
    gap: vars.spacing.md,
  },
]);

export const bottomInfoText = style({});
