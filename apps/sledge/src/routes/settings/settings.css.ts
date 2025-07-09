import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const settingContainer = style([
  flexCol,
  {
    padding: vars.spacing.lg,
    gap: vars.spacing.lg,
  },
]);
