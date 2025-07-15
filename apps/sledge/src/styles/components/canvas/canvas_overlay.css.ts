import { keyframes, style } from '@vanilla-extract/css';

const marchingAnts = keyframes({
  from: {
    strokeDashoffset: '0',
  },
  to: {
    strokeDashoffset: '12', // borderDash * 2 = 6 * 2 = 12
  },
});

export const marchingAntsAnimation = style({
  animation: `${marchingAnts} 1.2s linear infinite`,
});
