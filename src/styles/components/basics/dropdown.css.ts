import { style } from '@vanilla-extract/css';
import { vars } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';

// コンテナ要素
export const dropdownContainer = style({
  position: 'relative',
  display: 'inline-block',
  width: 'auto',
});

// トリガーボタン
export const triggerButton = style([
  flexRow,
  {
    backgroundColor: vars.color.primary,
    color: vars.color.text,
    border: `1px solid ${vars.color.border}`,
    padding: '3px 11px 4px 11px',
    width: 'fit-content',
    textAlign: 'left',
    minWidth: '120px',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    ':hover': {
      transform: 'none',
    },
    selectors: {
      '&:hover': { backgroundColor: vars.color.button_hover },
      '&:active': { backgroundColor: vars.color.button_pressed },
    },
  },
]);

// ドロップダウンメニュー
export const menuStyle = style([
  flexCol,
  {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 10,
    backgroundColor: vars.color.primary,
    border: `1px solid ${vars.color.border}`,
    marginTop: '0px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    minWidth: '120px',
    overflowY: 'auto',
    width: 'fit-content',
  },
]);

// メニューアイテム
export const menuItem = style({
  padding: '6px 10px 7px 10px',
  cursor: 'pointer',
  selectors: {
    '&:hover': { backgroundColor: vars.color.surface },
  },
});

export const itemText = style({
  whiteSpace: 'break-spaces',
  width: '100%',
});
