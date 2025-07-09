import { style } from '@vanilla-extract/css';

export const lightInnerOff = style({
  filter: 'drop-shadow(0 0 0 red);',
  opacity: 0,
  transition: 'none',
});

export const lightInnerOn = style({
  filter: 'drop-shadow(0 0 1px red);',
  opacity: 1,
  transition: 'opacity 1s ease',
});
