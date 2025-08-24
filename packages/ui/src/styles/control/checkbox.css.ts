import { vars } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const checkboxWrapper = style({
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  position: 'relative',
});

export const hiddenCheckbox = style({
  opacity: 0,
  width: 0,
  height: 0,
  position: 'absolute',
});

export const customCheckbox = style({
  width: '10px',
  height: '10px',
  border: `1px solid ${vars.color.button.border}`,
  borderRadius: '0px',
  display: 'inline-block',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.1s',
  selectors: {
    [`&::before`]: {
      content: '',
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '14px', // √2倍ちょい弱くらい
      height: '2px',
      backgroundColor: vars.color.enabled,
      opacity: 0,
      transform: 'translate(-50%, -50%) rotate(45deg)',
      transformOrigin: 'center center',
      transition: 'opacity 0.1s',
    },
    [`&::after`]: {
      content: '',
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '14px',
      height: '2px',
      backgroundColor: vars.color.enabled,
      opacity: 0,
      transform: 'translate(-50%, -50%) rotate(-45deg)',
      transformOrigin: 'center center',
      transition: 'opacity 0.1s',
    },
    [`${checkboxWrapper} input:checked + &::before`]: {
      opacity: 1,
    },
    [`${checkboxWrapper} input:checked + &::after`]: {
      opacity: 1,
    },
  },
});
