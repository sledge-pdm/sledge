import { flexCol } from '@sledge/core';
import { k12x8, vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const ButtonAreaContainer = style([
  flexCol,
  {
    gap: '1rem',
    marginBottom: '16px',
  },
]);

export const versionInfoText = style({
  fontFamily: k12x8,
  fontSize: '8px',
  '@media': {
    '(max-width: 599px)': {
      fontSize: '8px',
    },
  },
});
export const informationText = style({
  fontSize: '16px',
  userSelect: 'text',
  '@media': {
    '(max-width: 599px)': {
      fontSize: '8px',
    },
  },
});

export const loadingText = style({
  fontSize: '8px',
  color: vars.color.muted,
  '@media': {
    '(max-width: 599px)': {
      fontSize: '8px',
    },
  },
});
