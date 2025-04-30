import { globalStyle } from '@vanilla-extract/css';

globalStyle('html, body', {
  height: '100vh',
  width: '100vw',
  margin: 0,
  overflow: 'hidden',
  padding: 0,
  display: 'flex',
  flexDirection: 'row',
  userSelect: 'none',
});

globalStyle('main', {
  height: '100%',
  width: '100vw',
  userSelect: 'none',
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
  borderBottom: '1px solid black',
  fontSize: '0.5rem',
});

globalStyle('input::-webkit-outer-spin-button, input::-webkit-inner-spin-button', {
  appearance: 'none',
  margin: 0,
});
