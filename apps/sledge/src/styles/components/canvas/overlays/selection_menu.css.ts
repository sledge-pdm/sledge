import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const container = style([
  flexRow,
  {
    boxSizing: 'content-box',
    position: 'fixed',
    border: `1px solid ${vars.color.onBackground}`,
    backgroundColor: vars.color.surface,
    pointerEvents: 'all',
    zIndex: Consts.zIndex.canvasOverlay,
  },
]);

export const item = style([
  flexRow,
  {
    boxSizing: 'content-box',
    alignItems: 'center',
    pointerEvents: 'all',
    cursor: 'pointer',
    padding: '6px',
    gap: '6px',
    backgroundColor: vars.color.surface,
    ':hover': {
      filter: 'brightness(0.85)',
    },
  },
]);

export const divider = style([
  flexRow,
  {
    width: '1px',
    marginTop: '4px',
    marginBottom: '4px',
    boxSizing: 'content-box',
    backgroundColor: vars.color.muted,
  },
]);
