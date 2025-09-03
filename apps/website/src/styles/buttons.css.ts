import { flexRow } from "@sledge/core";
import { vars } from "@sledge/theme";
import { style } from "@vanilla-extract/css";


export const mainButtonContainer = style([
  flexRow,
  {
    marginTop: '0.5rem',
    gap: '2rem',
    flexWrap: 'wrap',
    '@media': {
      '(max-width: 768px)': {
        gap: '1rem',
      },
    },
  },
]);
export const mainButton = style({
  minWidth: '180px',
  fontSize: '16px',
  padding: '16px 28px',
  borderWidth: '2px',
  borderRadius: '4px',
  ':hover': {
    backgroundColor: vars.color.accent,
    borderColor: vars.color.accent,
    color: vars.color.background,
  },
  '@media': {
    '(max-width: 768px)': {
      borderWidth: '2px',
      padding: '12px 24px',
    },
  },
});

export const subButton = style({
  fontSize: '8px',
  padding: '8px 14px',
  borderWidth: '2px',
  borderRadius: '4px',
  ':hover': {
    backgroundColor: vars.color.accent,
    borderColor: vars.color.accent,
    color: vars.color.background,
  },
  '@media': {
    '(max-width: 768px)': {
      borderWidth: '2px',
      padding: '12px 24px',
    },
  },
});
