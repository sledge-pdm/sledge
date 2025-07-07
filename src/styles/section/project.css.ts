import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const projectNameInput = style({
  border: 'none',
  fontSize: vars.text.xl,
  marginBottom: vars.spacing.sm,
  marginLeft: '-2px',
  outline: 'none',

  '::placeholder': {
    opacity: 0.5,
  },
});

export const saveLog = style({
  color: 'limegreen',
  marginLeft: vars.spacing.sm,
});
