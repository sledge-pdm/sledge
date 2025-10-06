import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const paletteRoot = style([
  flexCol,
  {
    gap: '12px',
    marginLeft: '12px',
  },
]);

export const paletteColorBoxContainer = style([flexRow, {}]);

export const paletteColorBoxCaption = style({
  width: '12px',
  color: vars.color.muted,
});

export const paletteColorBoxPrimary = style({
  position: 'absolute',
  top: 0,
  left: 0,
});

export const paletteColorBoxSecondary = style({
  position: 'absolute',
  top: 10,
  left: 10,
});
