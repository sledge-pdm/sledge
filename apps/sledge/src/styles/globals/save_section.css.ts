import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const saveButtonRoot = style([
  flexRow,
  {
    position: 'relative',
    borderRadius: '4px',
    border: `1px solid ${vars.color.accent}`,
    overflow: 'hidden',
    margin: 0,
  },
]);

export const saveButtonMainButton = style([
  flexRow,
  {
    padding: '4px 12px',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    pointerEvents: 'all',
    ':hover': {
      backgroundColor: vars.color.button.hover,
    },
  },
]);

export const saveButtonSide = style([
  flexRow,
  {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 4px',
    borderLeft: `1px solid ${vars.color.border}`,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: vars.color.button.hover,
    },
  },
]);
