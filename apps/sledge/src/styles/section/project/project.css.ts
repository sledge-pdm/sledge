import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const projectNameInput = style({
  width: 0,
  flexGrow: 1,
  border: 'none',
  fontSize: vars.text.xl,
  marginLeft: '-2px',
  outline: 'none',

  borderBottom: `1px solid ${vars.color.border}`,
  paddingBottom: '2px',

  '::placeholder': {
    opacity: 0.5,
  },
});

export const saveLog = style({
  color: 'limegreen',
  marginLeft: vars.spacing.sm,
});
