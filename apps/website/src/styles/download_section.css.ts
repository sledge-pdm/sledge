import { k12x8, vars, ZFB09 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const versionInfoText = style({
  fontFamily: k12x8,
  fontSize: '8px',
});

export const osInfoText = style({
  fontFamily: ZFB09,
  fontSize: '8px',
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

export const assetText = style({
  width: 'fit-content',
  fontFamily: k12x8,
  fontSize: '8px',
  opacity: 0.5,
  lineHeight: 1.5,
  overflow: 'hidden',
  whiteSpace: 'normal',
  textWrap: 'pretty',
  wordBreak: 'break-all',
  userSelect: 'text',
});
