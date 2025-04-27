import { style } from '@vanilla-extract/css';
import { vars, ZFB03B } from '../global.css';
import { flexCol, flexRow, w100 } from '../snippets.css';

export const layerList = style([
  flexCol,
  w100,
  {
    flexGrow: 1,
    position: 'relative',
    gap: vars.spacing.xs,
    // border: '1px solid #333',
  },
]);

export const layerItem = style([
  flexRow,
  w100,
  {
    height: '36px',
    flexGrow: 1,
    cursor: 'pointer',
    backgroundColor: vars.color.surface,
    borderLeft: '3px solid #333',

    ':hover': {
      filter: 'brightness(0.94)',
    },
    ':active': {
      transform: 'translate(0, 1px)',
    },
  },
]);

export const layerItemDisabled = style({
  opacity: 0.3,
});

export const layerItemIndex = style([
  {
    flexGrow: 1,
    fontSize: vars.text.sm,
  },
]);

export const layerItemType = style({
  whiteSpace: 'nowrap',
  fontSize: vars.text.sm,
  opacity: 0.4,
});

export const layerItemName = style([
  {
    fontSize: vars.text.xl,
    fontFamily: ZFB03B,
    margin: `${vars.spacing.md} 0 0 ${vars.spacing.lg}`,
  },
]);

export const dotMagnifContainer = style([
  {
    alignSelf: 'center',
    // border: '1px black solid',
    // borderRadius: vars.spacing.xs,
    cursor: 'pointer',
    marginTop: vars.spacing.sm,
    marginLeft: 'auto',
    marginRight: 0,
    padding: `2px ${vars.spacing.xs}`,
    pointerEvents: 'all',

    ':hover': {
      color: vars.color.muted,
    },
  },
]);

export const dotMagnifText = style([
  {
    fontFamily: ZFB03B,
    fontSize: vars.text.lg,
  },
]);

export const activeLight = style([
  {
    alignSelf: 'center',
    margin: `${vars.spacing.sm}px 0`,
    marginLeft: vars.spacing.sm,
    marginRight: vars.spacing.md,
  },
]);

export const dropPlaceholder = style([
  {
    border: '2px dashed #aaa',
    borderRadius: vars.spacing.md,
    height: '32px',
    margin: `${vars.spacing.xs}px 0`,
  },
]);
