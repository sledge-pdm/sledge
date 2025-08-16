import { flexRow, w100 } from '@sledge/core';
import { vars, ZFB08, ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const keyConfigRow = style([
  flexRow,
  w100,
  {
    boxSizing: 'border-box',
    backgroundColor: vars.color.surface,
    alignItems: 'center',
    padding: '8px 8px',
  },
]);

export const keyConfigName = style({
  fontFamily: ZFB09,
  fontSize: '8px',
  width: '50%',
});

export const keyConfigValue = style({
  fontFamily: ZFB08,
  fontSize: '8px',
  alignContent: 'center',
  width: '100%',
  height: '100%',
});
