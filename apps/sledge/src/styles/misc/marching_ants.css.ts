import { keyframes, style } from '@vanilla-extract/css';

export const marchingAntsAnimation = style({
  animation: `${keyframes({
    from: {
      strokeDashoffset: '0',
    },
    to: {
      strokeDashoffset: '12', // borderDash * 2 = 6 * 2 = 12
    },
  })} 1.2s linear infinite`,
});
