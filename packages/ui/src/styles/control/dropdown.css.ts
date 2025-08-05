import { Consts, flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style, styleVariants } from '@vanilla-extract/css';

// コンテナ要素
export const dropdownContainer = style({
  position: 'relative',
  display: 'inline-block',
  boxSizing: 'border-box',
  width: 'auto',
});

// トリガーボタン
export const triggerButton = style([
  flexRow,
  {
    backgroundColor: vars.color.background,
    border: `1px solid ${vars.color.border}`,
    padding: '5px 11px 5px 11px',
    width: 'fit-content',
    textAlign: 'left',
    minWidth: '100px',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    ':hover': {
      transform: 'none',
    },
    selectors: {
      '&:hover': { backgroundColor: vars.color.button.hover },
      '&:active': { backgroundColor: vars.color.button.hover },
    },
  },
]);

export const triggerButtonNoBG = style([
  flexRow,
  triggerButton,
  {
    background: 'none',
    backgroundColor: 'none',
    border: `none`,
  },
]);

// ドロップダウンメニュー
export const menuStyle = style([
  flexCol,
  {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: Consts.zIndex.dropdownMenu,
    backgroundColor: vars.color.background,
    border: `1px solid ${vars.color.border}`,
    marginTop: '0px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    minWidth: '100px',
    overflowY: 'auto',
    width: 'fit-content',
  },
]);

export const menuDirection = styleVariants({
  down: {
    top: '100%', // 従来どおり下に
    bottom: 'auto',
    marginTop: '0px',
    boxShadow: '0 2px 8px rgba(0,0,0,.1)',
  },
  up: {
    top: 'auto',
    bottom: '100%', // トリガーの上に配置
    marginBottom: '0px',
    boxShadow: '0 -2px 8px rgba(0,0,0,.1)',
  },
});

// メニューアイテム
export const menuItem = style({
  padding: '8px 10px 8px 10px',
  cursor: 'pointer',
  selectors: {
    '&:hover': { backgroundColor: vars.color.surface },
  },
});

export const itemText = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  color: vars.color.onBackground,
  width: '100%',
});
