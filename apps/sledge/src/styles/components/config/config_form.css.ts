import { flexCol, flexRow, w100 } from '@sledge/core';
import { vars, ZFB08, ZFB09, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const configFormRoot = style([
  flexRow,
  w100,
  {
    position: 'relative',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
]);

export const configFormSections = style([
  flexCol,
  {
    borderRight: `1px solid ${vars.color.border}`,
    width: '150px',
    paddingTop: '20px',
  },
]);

export const configFormSectionItem = style([
  flexRow,
  {
    padding: vars.spacing.md,
    paddingLeft: vars.spacing.lg,
    gap: vars.spacing.sm,
    alignItems: 'center',
    cursor: 'pointer',
    pointerEvents: 'all',
    ':hover': {
      backgroundColor: vars.color.surface,
    },
  },
]);

export const configFormSectionLabel = style({
  fontFamily: ZFB08,
  fontSize: '8px',
  whiteSpace: 'nowrap',
  ':hover': {
    color: vars.color.onBackground,
  },
});

export const configFormFields = style([
  flexCol,
  {
    position: 'absolute',
    left: '150px',
    right: '0',
    top: '0',
    bottom: '0',
    overflowY: 'scroll',
    boxSizing: 'border-box',
    gap: vars.spacing.xl,

    '::-webkit-scrollbar': {
      width: '2px',
      backgroundColor: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
    },
    selectors: {
      '&:hover::-webkit-scrollbar-thumb': {
        backgroundColor: '#888',
      },
    },
  },
]);

export const configFormScrollContent = style([
  flexCol,
  {
    overflowY: 'visible',
    gap: vars.spacing.xl,
    margin: `32px 28px`,
  },
]);

export const configFormNoPreset = style([
  {
    marginTop: vars.spacing.lg,
    color: vars.color.muted,
    alignSelf: 'center',
  },
]);

export const configFormFieldHeader = style([
  {
    marginBottom: vars.spacing.xs,
    fontSize: '12px',
    fontFamily: ZFB31,
    color: vars.color.accent,
  },
]);

export const configFormFieldItem = style([
  flexCol,
  {
    justifyContent: 'center',
    gap: vars.spacing.lg,
  },
]);

export const configFormFieldLabelTooltip = style({
  width: 'fit-content',
  fontFamily: ZFB09,
  color: vars.color.muted,
  cursor: 'help',
  ':hover': {
    color: vars.color.active,
  },
});

export const configFormFieldLabel = style({
  // width: '100%',
  fontFamily: ZFB09,
  // textDecoration: 'underline',
  verticalAlign: 'middle',
  marginBottom: '-1px',
  textAlign: 'left',
  marginRight: '16px',
});

export const configFormFieldControlWrapper = style([
  flexRow,
  {
    maxWidth: '260px',
    marginLeft: vars.spacing.md,
    alignItems: 'center',
  },
]);

export const configFormFieldControlLabel = style([
  {
    minWidth: '64px',
    cursor: 'pointer',
  },
]);

export const configFormInfoAreaTop = style([
  flexRow,
  {
    position: 'absolute',
    top: vars.spacing.xl,
    right: vars.spacing.xl,
    alignItems: 'center',
    gap: vars.spacing.md,
  },
]);

export const configFormInfoAreaBottom = style([
  flexCol,
  {
    position: 'absolute',
    bottom: vars.spacing.xl,
    left: vars.spacing.xl,
    gap: vars.spacing.md,
  },
]);

export const configFormLoadDefaults = style({
  color: '#ccc',
});
