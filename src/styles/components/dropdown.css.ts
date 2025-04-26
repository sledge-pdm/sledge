import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';

export const dropdownRoot = style({
  fontFamily: vars.font.body,
  fontSize: vars.text.sm,
  backgroundColor: vars.color.secondary,
  border: '0px solid black',
  borderRadius: '0px',
  padding: '2px 6px',
  height: '20px',
  cursor: 'pointer',
  lineHeight: '12px',

  selectors: {
    '&:hover': { backgroundColor: vars.color.button_hover },
    '&:active': {
      backgroundColor: vars.color.button_pressed,
    },
    /* Windows の ▼ 矢印が滲むのを抑止 */
    '&::-ms-expand': { display: 'none' },
  },
});
