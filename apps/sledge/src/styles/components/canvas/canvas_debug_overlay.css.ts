import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';
import { Consts } from '~/Consts';

export const canvasDebugOverlayTopLeft = style([
  flexCol,
  {
    // gap: vars.spacing.xs,
    position: 'absolute',
    left: vars.spacing.sm,
    top: vars.spacing.sm,
    pointerEvents: 'none',
    zIndex: Consts.zIndex.canvasOverlay,
  },
]);

export const canvasDebugOverlayBottomLeft = style([
  flexRow,
  {
    position: 'absolute',
    left: vars.spacing.sm,
    bottom: vars.spacing.sm,
    alignItems: 'end',
    gap: vars.spacing.md,
    pointerEvents: 'none',
    zIndex: Consts.zIndex.canvasOverlay,
  },
]);
