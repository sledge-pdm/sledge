import { style } from '@vanilla-extract/css';
import { k12x8, vars, ZFB03B } from '../global.css';
import { flexCol, flexRow, h100, w100 } from '../snippets.css';

export const layerList = style([
  flexCol,
  w100,
  {
    position: 'relative',
    gap: vars.spacing.xs,
  },
]);

export const layerItem = style([
  flexRow,
  w100,
  {
    height: '40px',
    flexGrow: 1,
    cursor: 'pointer',
    backgroundColor: vars.color.surface,

    ':hover': {
      filter: 'brightness(0.94)',
    },
    ':active': {
      transform: 'translate(0, 1px)',
    },
  },
]);

export const layerItemHandle = style([
  flexCol,
  h100,
  {
    width: '12px',
    borderRight: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
]);

export const layerItemDisabled = style({
  opacity: 0.3,
});

export const layerItemIndex = style([
  {
    whiteSpace: 'nowrap',
    fontSize: vars.text.sm,
    opacity: 0.2,
    width: '16px',
  },
]);

export const layerItemType = style({
  whiteSpace: 'nowrap',
  fontSize: vars.text.sm,
  opacity: 0.6,
});

export const layerItemName = style([
  {
    fontFamily: `${ZFB03B},${k12x8}`,
    marginLeft: '16px',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
]);

export const dotMagnifContainer = style([
  {
    alignSelf: 'center',
    // border: '1px black solid',
    // borderRadius: vars.spacing.xs,
    cursor: 'pointer',
    marginTop: vars.spacing.sm,
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
    border: `2px dashed ${vars.color.border}`,
    borderRadius: vars.spacing.md,
    height: '32px',
    margin: `${vars.spacing.xs}px 0`,
  },
]);
