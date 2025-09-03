import { flexCol } from '@sledge/core';
import { vars, ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const ButtonAreaContainer = style([
  flexCol,
  {
    gap: '1rem',
    marginBottom: '16px',
  },
]);

export const versionInfoText = style({
  fontFamily: ZFB09,
  fontSize: '8px',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '8px',
    },
  },
});
export const informationText = style({
  fontSize: '8px',
  userSelect: 'text',
  '@media': {
    '(max-width: 768px)': {
      fontSize: '8px',
    },
  },
});

export const loadingText = style({
  fontSize: '8px',
  color: vars.color.muted,
  '@media': {
    '(max-width: 768px)': {
      fontSize: '8px',
    },
  },
});
