import { createTheme, createThemeContract, fontFace, globalStyle, style } from '@vanilla-extract/css';

/**
 * ---------------------------------------------------------------------------
 * 1. Font faces –変更なし
 * ---------------------------------------------------------------------------
 */
export const ZFB03 = fontFace({ src: 'url("/fonts/04B/04B_03__.ttf")' });
export const ZFB03B = fontFace({ src: 'url("/fonts/04B/04B_03B_.ttf")' });
export const ZFB08 = fontFace({ src: 'url("/fonts/04B/04B_08__.ttf")' });
export const ZFB09 = fontFace({ src: 'url("/fonts/04B/04B_09__.ttf")' });
export const ZFB11 = fontFace({ src: 'url("/fonts/04B/04B_11__.ttf")' });
export const ZFB19 = fontFace({ src: 'url("/fonts/04B/04B_19__.ttf")' });
export const ZFB20 = fontFace({ src: 'url("/fonts/04B/04B_20__.ttf")' });
export const ZFB21 = fontFace({ src: 'url("/fonts/04B/04B_21__.ttf")' });
export const ZFB24 = fontFace({ src: 'url("/fonts/04B/04B_24__.ttf")' });
export const ZFB25 = fontFace({ src: 'url("/fonts/04B/04B_25__.ttf")' });
export const ZFB30 = fontFace({ src: 'url("/fonts/04B/04B_30__.ttf")' });
export const ZFB31 = fontFace({ src: 'url("/fonts/04B/04B_31__.ttf")' });
export const Terminus = fontFace({ src: 'url("/fonts/terminus/TerminusTTF-4.49.3.ttf")' });
export const k8x12 = fontFace({ src: 'url("/fonts/k8x12/k8x12.ttf")' });
export const k8x12L = fontFace({ src: 'url("/fonts/k8x12/k8x12L.ttf")' });
export const k8x12S = fontFace({ src: 'url("/fonts/k8x12/k8x12S.ttf")' });
export const k12x8 = fontFace({ src: 'url("/fonts/k12x8/k12x8.ttf")' });

/**
 * ---------------------------------------------------------------------------
 * 2. Theme contract – 全トークンを宣言 (値は null)。
 *    色以外はライト/ダーク共通のため shared 定義にまとめます。
 * ---------------------------------------------------------------------------
 */
export const vars = createThemeContract({
  themeStyle: 'light' as 'light' | 'dark' | 'black',
  color: {
    background: null,
    surface: null,
    canvasArea: null,
    canvas: null,
    onBackground: null,
    border: null,
    borderSecondary: null,
    accent: null,
    active: null,
    enabled: null,
    muted: null,
    error: null,
    warn: null,
    overlay: null,
    button: {
      bg: null,
      hover: null,
      active: null,
      text: null,
      border: null,
    },
  },
  size: {
    bottomInfo: null,
    dialogRadius: null,
    buttonRadius: null,
  },
  spacing: {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
  },
  text: {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
  },
  font: {
    body: null,
  },
});

/** Shared (非テーマ依存) トークン値 */
const shared = {
  size: {
    bottomInfo: '20px',
    dialogRadius: '6px',
    buttonRadius: '2px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  text: {
    xs: '6px',
    sm: '8px',
    md: '10px',
    lg: '12px',
    xl: '16px',
  },
  font: {
    body: `${ZFB08}, ${k8x12}`,
  },
} as const;

/**
 * ---------------------------------------------------------------------------
 * 3. テーマ定義 – ライト / ダーク
 * ---------------------------------------------------------------------------
 */
export const lightTheme = createTheme(vars, {
  themeStyle: 'light',
  color: {
    background: '#ffffff',
    surface: '#f2f2f2',
    canvasArea: '#fafafa',
    canvas: '#ffffff',
    onBackground: '#000000D9',
    border: '#aaaaaa',
    borderSecondary: '#dddddd',
    accent: '#0000ff',
    active: '#ff0000',
    enabled: '#00ff00',
    muted: 'rgba(0,0,0,0.35)',
    error: '#ff0000',
    warn: '#ffcc00',
    overlay: 'rgba(0, 0, 0, 0.5)',
    button: {
      bg: '#ffffff',
      hover: '#e5e5e5',
      active: '#e0e0e0',
      text: '#000000DE',
      border: '#000000DE',
    },
  },
  ...shared,
});

const darkThemeColorBase = {
  background: '#252525',
  surface: '#353535',
  canvasArea: '#1B1B1B',
  canvas: '#eeeeee',
  onBackground: '#eeeeee',
  border: '#666666',
  borderSecondary: '#444444',
  accent: '#ffff00',
  active: '#00ff00',
  enabled: '#00ff00',
  muted: 'rgba(255,255,255,0.30)',
  error: '#ff5f5f',
  warn: '#fffb00',
  overlay: 'rgba(255, 255, 255, 0.5)',
  button: {
    bg: '#222222',
    hover: '#444444',
    active: '#555555',
    text: '#eeeeee',
    border: '#bbbbbb',
  },
};

export const darkTheme = createTheme(vars, {
  themeStyle: 'dark',
  color: darkThemeColorBase,
  ...shared,
});

export const darkThemeGYFlip = createTheme(vars, {
  themeStyle: 'dark',
  color: {
    ...darkThemeColorBase,
    accent: darkThemeColorBase.active,
    active: darkThemeColorBase.accent,
  },
  ...shared,
});

const blackThemeColorBase = {
  background: '#000000',
  surface: '#202020',
  canvasArea: '#000000',
  canvas: '#eeeeee',
  onBackground: '#eeeeee',
  border: '#3A3A3A',
  borderSecondary: '#242424',
  accent: '#ff00ff',
  active: '#ff00ff',
  enabled: '#00ff00',
  muted: 'rgba(255,255,255,0.30)',
  error: '#ff5f5f',
  warn: '#fffb00',
  overlay: 'rgba(255, 255, 255, 0.320)',
  button: {
    bg: '#222222',
    hover: '#444444',
    active: '#555555',
    text: '#eeeeee',
    border: '#aaaaaa',
  },
};

export const blackTheme = createTheme(vars, {
  themeStyle: 'black',
  color: blackThemeColorBase,
  ...shared,
});

/**
 * ---------------------------------------------------------------------------
 * 4. Global styles – vars を直接参照
 * ---------------------------------------------------------------------------
 */
globalStyle('html, body', {
  height: '100%',
  margin: 0,
  backgroundColor: vars.color.background,
  color: vars.color.onBackground,
  fontFamily: vars.font.body,
});

globalStyle('div', {
  boxSizing: 'border-box',
});

globalStyle('button, p, a, input, label, span', {
  fontFamily: vars.font.body,
  color: vars.color.onBackground,
});

globalStyle('a:hover', {
  color: vars.color.accent,
});

globalStyle('button', {
  background: vars.color.button.bg,
  border: `1px solid ${vars.color.button.border}`,
  borderRadius: vars.size.buttonRadius,
  cursor: 'pointer',
  fontSize: '8px',
  height: 'fit-content',
  padding: '2px 6px',
  pointerEvents: 'all',
  width: 'fit-content',
});

globalStyle('button:hover', {
  background: vars.color.button.hover,
});

globalStyle('button:active', {
  background: vars.color.button.active,
  transform: 'translateY(1px)',
});

/**
 * ---------------------------------------------------------------------------
 * 5. Utility classes / component-level styles
 * ---------------------------------------------------------------------------
 */
export const accentedButton = style({
  width: 'fit-content',
  border: `1px solid ${vars.color.accent}`,
  background: vars.color.button.bg,
  color: vars.color.accent,
  pointerEvents: 'all',
  ':hover': {
    color: '#ffffff',
    background: vars.color.accent,
  },
  ':disabled': {
    color: vars.color.muted,
    border: `1px solid ${vars.color.muted}`,
    pointerEvents: 'none',
  },
});

export const pageRoot = style({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  width: '100%',
  userSelect: 'none',
  backgroundColor: vars.color.background,
});

export const sledgeLogo = style({
  bottom: '2px',
  position: 'absolute',
  right: '2px',
});
