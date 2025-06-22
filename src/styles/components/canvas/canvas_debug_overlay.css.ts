import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';

export const canvasDebugOverlayTopLeft = style([
  flexCol,
  {
    // gap: vars.spacing.xs,
    position: 'absolute',
    left: vars.spacing.sm,
    top: vars.spacing.sm,
    pointerEvents: 'none',
  },
]);

export const canvasDebugOverlayBottomLeft = style([
  flexRow,
  {
    position: 'absolute',
    left: vars.spacing.sm,
    bottom: 0,
    transform: 'translateY(-50%)',
    alignItems: 'end',
    gap: vars.spacing.md,
    pointerEvents: 'none',
  },
]);
