import { style } from '@vanilla-extract/css';
import { vars } from '../global.css';
import { flexCol, flexRow } from '../snippets.css';

export const edgeInfoRoot = style([
  flexCol,
  {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    gap: '10px',
    paddingTop: '32px',
    width: vars.size.edge_info,
    justifyContent: 'start',
    alignItems: 'center',
  },
]);
export const edgeInfoItem = style([
  flexRow,
  {
    position: 'relative',
    justifyContent: 'center',
  },
]);

export const edgeInfoText = style({
  fontSize: '0.5rem',
  letterSpacing: '2px',
  whiteSpace: 'nowrap',
  transform: 'rotate(180deg)',
  transformOrigin: 'center',
  writingMode: 'vertical-lr',
});
