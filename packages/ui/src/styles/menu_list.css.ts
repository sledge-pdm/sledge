import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { style, styleVariants } from '@vanilla-extract/css';

// ドロップダウンメニュー
export const menuStyle = style([
  flexCol,
  {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 10,
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
export const menuItem = style({
  cursor: 'pointer',
  selectors: {
    '&:hover': { backgroundColor: vars.color.surface },
  },
});

export const itemText = style({
  margin: '8px 10px 8px 10px',
  whiteSpace: 'nowrap',
  color: vars.color.onBackground,
});
