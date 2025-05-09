import { createGlobalTheme, fontFace, globalStyle, style } from '@vanilla-extract/css';

export const ZFB03 = fontFace({
  src: 'url("/fonts/04B/04B_03__.ttf")',
});
export const ZFB03B = fontFace({
  src: 'url("/fonts/04B/04B_03B_.ttf")',
});
export const ZFB08 = fontFace({
  src: 'url("/fonts/04B/04B_08__.ttf")',
});
export const ZFB09 = fontFace({
  src: 'url("/fonts/04B/04B_09__.ttf")',
});
export const ZFB11 = fontFace({
  src: 'url("/fonts/04B/04B_11__.ttf")',
});
export const ZFB31 = fontFace({
  src: 'url("/fonts/04B/04B_31__.ttf")',
});
export const Terminus = fontFace({
  src: 'url("/fonts/terminus/TerminusTTF-4.49.3.ttf")',
});
export const k8x12 = fontFace({
  src: 'url("/fonts/k8x12/k8x12.ttf")',
});
export const k8x12L = fontFace({
  src: 'url("/fonts/k8x12/k8x12L.ttf")',
});
export const k8x12S = fontFace({
  src: 'url("/fonts/k8x12/k8x12S.ttf")',
});
export const k12x8 = fontFace({
  src: 'url("/fonts/k12x8/k12x8.ttf")',
});

export const vars = createGlobalTheme(':root', {
  color: {
    primary: '#ffffff',
    secondary: '#f0f0f0',
    text: '#111111',
    danger: '#ff0000',
    muted: '#00000030',

    accent: '#0000ff',

    border: '#aaa',

    bg: '#ffffff',
    bg_canvas_area: '#fefefe',

    surface: '#f2f2f2',

    button: '#ffffff',
    button_hover: '#f0f0f0',
    button_pressed: '#f0f0f0',

    input_bg: '#fafafa',
  },
  size: {
    edge_info: '32px',
    side_area: '250px',
    bottom_bar_margin: '252px',
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
});

globalStyle('button, p, a, input, label', {
  fontFamily: `${ZFB08}, ${k12x8}`,
  color: vars.color.text,
});

globalStyle('a:hover', {
  color: 'red',
});

globalStyle('button', {
  background: vars.color.button,
  border: '1px black solid',
  borderRadius: '2px',
  cursor: 'pointer',
  fontSize: '0.5rem',
  height: 'fit-content',
  padding: '2px 6px',
  pointerEvents: 'all',
  width: 'fit-content',
});

globalStyle('button:hover', {
  background: vars.color.button_hover,
});

globalStyle('button:active', {
  background: vars.color.button_pressed,
  transform: 'translateY(1px)',
});

export const pageRoot = style({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  width: '100vw',
  userSelect: 'none',
});

export const sledgeLogo = style({
  bottom: '2px',
  position: 'absolute',
  right: '2px',
});
