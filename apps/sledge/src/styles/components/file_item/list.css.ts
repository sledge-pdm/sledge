import { flexCol } from '@sledge/core';
import { vars, ZFB03B, ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const rflThumb = style([
  flexCol,
  {
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.background,
    maxWidth: `150px`,
    maxHeight: `150px`,
    opacity: 0.8,
    overflow: 'hidden',
  },
]);

export const rflItem = style([
  flexCol,
  {
    position: 'relative',
    width: 'fit-content',
    padding: `${vars.spacing.sm} ${vars.spacing.sm}`,
    marginLeft: `-8px`,
  },
]);

export const rflName = style({
  fontFamily: ZFB09,
  fontSize: '8px',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const rflPath = style({
  fontFamily: ZFB03B,
  fontSize: vars.text.md,
  opacity: 0.4,
});
