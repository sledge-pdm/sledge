import { vars } from '@sledge/theme';
import { globalStyle, style } from '@vanilla-extract/css';

const globalWidth = 16;
const thumbWidth = 10;
const thumbPadding = 2;
const globalHeight = 10;

/* ラベル全体 */
export const toggleWrapper = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.sm,
  cursor: 'pointer',
  userSelect: 'none',
});

/* 入力本体 (隠す) */
export const toggleInput = style({
  opacity: 0,
  width: 0,
  height: 0,
  position: 'absolute',
});

/* バックグラウンドとなるトラック */
export const toggleTrack = style({
  width: `${globalWidth}px`,
  height: `${globalHeight}px`,
  backgroundColor: vars.color.muted,
  border: `1px solid ${vars.color.button.border}`,
  borderRadius: '0px',
  position: 'relative',
  transition: 'background-color 0.05s',
});

/* つまみ */
export const toggleThumb = style({
  position: 'absolute',
  top: '-1px',
  left: '-1px',
  width: `${thumbWidth - thumbPadding}px`,
  height: `${globalHeight}px`,
  backgroundColor: 'white',
  border: `1px solid ${vars.color.button.border}`,
  // border: "1px solid white",
  borderRadius: '0px',
  transition: 'transform 0.02s',
});

/* ───────── 状態連動スタイル ───────── */

/* input が :checked のとき隣接する track を赤系へ */
globalStyle(`${toggleInput}:checked + ${toggleTrack}`, {
  backgroundColor: vars.color.enabled,
});

/* さらに thumb を右へスライド */
globalStyle(`${toggleInput}:checked + ${toggleTrack} ${toggleThumb}`, {
  transform: `translateX(${globalWidth - thumbWidth + 2}px)`,
});
