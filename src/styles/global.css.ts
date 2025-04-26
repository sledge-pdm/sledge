import {
  createGlobalTheme,
  fontFace,
  globalStyle,
  style,
} from '@vanilla-extract/css'
import { flexCol, flexRow, h100 } from './snippets.css'

export const ZFB03 = fontFace({
  src: 'url("/fonts/04B_03__.ttf")',
})
export const ZFB03B = fontFace({
  src: 'url("/fonts/04B_03B_.ttf")',
})
export const ZFB08 = fontFace({
  src: 'url("/fonts/04B_08__.ttf")',
})
export const ZFB09 = fontFace({
  src: 'url("/fonts/04B_09__.ttf")',
})
export const ZFB11 = fontFace({
  src: 'url("/fonts/04B_11__.ttf")',
})
export const ZFB31 = fontFace({
  src: 'url("/fonts/04B_31__.ttf")',
})
export const Terminus = fontFace({
  src: 'url("/fonts/terminus/TerminusTTF-4.49.3.ttf")',
})
export const k8x12 = fontFace({
  src: 'url("/fonts/k8x12/k8x12.ttf")',
})
export const k8x12L = fontFace({
  src: 'url("/fonts/k8x12/k8x12L.ttf")',
})
export const k8x12S = fontFace({
  src: 'url("/fonts/k8x12/k8x12S.ttf")',
})
export const k12x8 = fontFace({
  src: 'url("/fonts/k12x8/k12x8.ttf")',
})

export const vars = createGlobalTheme(':root', {
  color: {
    primary: '#ffffff',
    secondary: '#f0f0f0',
    text: '#111111',
    danger: '#ff0000',
    muted: '#00000030',

    bg: '#ffffff',
    bg_canvas_area: '#fefefe',

    surface: '#f0f0f0',

    button: '#ffffff',
    button_hover: '#f0f0f0',
    button_pressed: '#f0f0f0',
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
})

globalStyle('button, p, a, input', {
  fontFamily: ZFB08,
  color: vars.color.text,
})

globalStyle('a:hover', {
  color: 'red',
})

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
})

globalStyle('button:hover', {
  background: vars.color.button_hover,
})

globalStyle('button:active', {
  background: vars.color.button_pressed,
  transform: 'translateY(1px)',
})

export const pageRoot = style({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  userSelect: 'none',
  overflow: 'hidden',
})

export const sideArea = style([flexRow, h100])

export const sideAreaEdge = style([
  flexCol,
  h100,
  {
    gap: '20px',
    width: '20px',
    padding: '10px 0 50px 2px',
    justifyContent: 'flex-end',
  },
])

export const sideAreaEdgeText = style({
  fontSize: '0.5rem',
  letterSpacing: '2px',
  transform: 'rotate(180deg)',
  whiteSpace: 'nowrap',
  writingMode: 'vertical-rl',
})

export const sideAreaContent = style([
  flexCol,
  {
    borderRight: '1px solid #aaa',
    gap: '1rem',
    padding: '20px 40px 90px 20px',
    width: '230px',
    overflowY: 'scroll',
    '::-webkit-scrollbar': {
      width: '4px',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
    },
    selectors: {
      '&:hover::-webkit-scrollbar-thumb': {
        backgroundColor: '#ddd',
      },
    },
  },
])

export const sledgeLogo = style({
  bottom: '2px',
  position: 'absolute',
  right: '2px',
})
