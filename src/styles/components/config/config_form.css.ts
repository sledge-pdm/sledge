import { style } from '@vanilla-extract/css';
import { vars, ZFB08, ZFB09, ZFB31 } from '~/styles/global.css';
import { flexCol, flexRow, h100, wh100 } from '~/styles/snippets.css';

export const configFormRoot = style([
  flexRow,
  wh100,
  {
    position: 'relative',
  },
]);

export const configFormSections = style([
  flexCol,
  h100,
  {
    borderRight: '1px solid #aaa',
    minWidth: '170px',
    paddingTop: vars.spacing.lg,
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
      backgroundColor: vars.color.secondary,
    },
  },
]);

export const configFormSectionLabel = style({
  fontFamily: ZFB08,
  fontSize: '8px',
  whiteSpace: 'nowrap',
  ':hover': {
    color: vars.color.text,
  },
});

export const configFormFields = style([
  flexCol,
  wh100,
  {
    marginRight: vars.spacing.lg,
    marginLeft: vars.spacing.xl,
    marginTop: vars.spacing.xs,
    gap: vars.spacing.xl,
  },
]);

export const configFormFieldHeader = style([
  {
    fontFamily: ZFB31,
    fontSize: vars.text.lg,
    marginTop: vars.spacing.xl,
    marginBottom: vars.spacing.sm,
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
  color: '#aaa',
});

export const configFormFieldLabel = style({
  width: 'fit-content',
  fontFamily: ZFB09,
  textDecoration: 'underline',
  alignSelf: 'center',
  marginRight: '8px',
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
  flexRow,
  {
    position: 'absolute',
    bottom: vars.spacing.xl,
    left: vars.spacing.xl,
    alignItems: 'center',
    gap: vars.spacing.md,
  },
]);

export const configFormLoadDefaults = style({
  color: '#ccc',
});
