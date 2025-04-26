import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { flexCol } from '~/styles/snippets.css';

export const settingContainer = style([
  flexCol,
  {
    padding: vars.spacing.lg,
  },
]);
