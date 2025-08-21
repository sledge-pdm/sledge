import { Consts, flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style, styleVariants } from '@vanilla-extract/css';

// ドロップダウンメニュー
export const menuStyle = style([
  flexCol,
  {
    position: 'absolute',
    top: '100%',
    zIndex: Consts.zIndex.dropdownMenu,
    backgroundColor: vars.color.background,
    border: `1px solid ${vars.color.border}`,
    maxHeight: '200px',
    overflowY: 'auto',
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
export const menuItem = style([
  flexRow,
  {
    padding: '7px 10px 7px 10px',
    gap: '14px',
    cursor: 'pointer',
    selectors: {
      '&:hover': { backgroundColor: vars.color.surface },
    },
  },
]);

export const itemText = style({
  whiteSpace: 'nowrap',
});
