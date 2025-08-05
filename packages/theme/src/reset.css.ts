import { globalStyle } from '@vanilla-extract/css';
import { vars } from './global.css';

globalStyle('html, body', {
  height: '100vh',
  width: '100vw',
  margin: 0,
  overflow: 'hidden',
  padding: 0,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
});

globalStyle('main', {
  width: '100vw',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  backgroundColor: vars.color.background,
});

globalStyle('p, a, label', {
  fontSize: '0.5rem',
  letterSpacing: '1px',
  margin: 0,
});

globalStyle('ul', {
  listStyle: 'none',
  paddingLeft: 0,
});

globalStyle('a', {
  cursor: 'pointer',
});

globalStyle('input', {
  border: 'none',
  outline: 'none',
  background: 'none',
  borderBottom: `1px solid ${vars.color.onBackground}`,
  fontSize: '0.5rem',
  userSelect: 'initial',
  WebkitUserSelect: 'initial',
  cursor: 'text',
  pointerEvents: 'auto',
});

globalStyle('input::-webkit-outer-spin-button, input::-webkit-inner-spin-button', {
  appearance: 'none',
  margin: 0,
});
