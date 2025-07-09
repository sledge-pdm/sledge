import { flexRow } from '@sledge/core';
import { ZFB03B, ZFB08 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const keyConfigRow = style([
  flexRow,
  {
    alignItems: 'center',
    minHeight: '24px',
  },
]);

export const keyConfigName = style({
  fontFamily: ZFB03B,
  fontSize: '8px',
  minWidth: '80px',
});

export const keyConfigValue = style({
  fontFamily: ZFB08,
  fontSize: '8px',
  alignContent: 'center',
  width: '100%',
  height: '100%',
});
