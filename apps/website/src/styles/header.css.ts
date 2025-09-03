import { flexCol } from '@sledge/core';
import { k12x8, vars, ZFB31 } from '@sledge/theme';
import { style } from '@vanilla-extract/css';

export const headerRoot = style([
  flexCol,
  {
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    boxSizing: 'content-box',
    height: 'auto',
    padding: '3rem 0 0rem 0',
    marginBottom: '3rem',
    backgroundColor: vars.color.background,
    borderBottom: `1px solid ${vars.color.borderSecondary}`,
    zIndex: 10,
    '@media': {
      '(max-width: 599px)': {
        justifyContent: 'auto',
        padding: '2.5rem 0 0rem 0',
      },
    },
  },
]);

export const headerContentContainer = style([
  flexCol,
  {
    justifySelf: 'center',
    height: 'auto',
    padding: '0 4rem 0 3rem',
    '@media': {
      '(max-width: 599px)': {
        boxSizing: 'border-box',
        width: '100%',
        padding: '0 2rem 0 2rem',
      },
    },
  },
]);

export const sledgeText = style({
  fontFamily: `${ZFB31}, ${k12x8}`,
  fontSize: '36px',
  letterSpacing: '2px',
  marginBottom: '6px',
  '@media': {
    '(max-width: 400px)': {
      fontSize: '32px',
    },
  },
});

// 行数可変なので固定+マージン取り
export const flavorTextContainer = style([
  flexCol,
  {
    height: '24px',
  },
]);

export const flavorText = style({
  fontFamily: k12x8,
  fontSize: '8px',
  color: vars.color.active,
  fontStyle: 'italic',

  '@media': {
    '(max-width: 599px)': {
      fontSize: '12px',
      marginBottom: '0.25rem',
    },
  },
});

export const menuContainer = style([
  flexCol,
  {
    boxSizing: 'border-box',
    maxWidth: '500px',
    overflowX: 'auto',
    padding: '0 4rem 0 3rem',
    '@media': {
      '(max-width: 599px)': {
        boxSizing: 'border-box',
        width: '100%',
        padding: '0 2rem 0 2rem',
      },
    },
  },
]);
