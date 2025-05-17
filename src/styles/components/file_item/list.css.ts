import { style } from '@vanilla-extract/css';
import { vars, ZFB03B, ZFB09 } from '~/styles/global.css';
import { flexCol } from '~/styles/snippets.css';

export const rflThumb = style([
  flexCol,
  {
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.primary,
    maxWidth: `150px`,
    maxHeight: `150px`,
    opacity: 0.8,
    overflow: 'hidden',
  },
]);

export const rflItem = style([
  flexCol,
  {
    position: 'relative',
    gap: '2px',
    width: 'fit-content',
    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
    marginLeft: `-8px`,
  },
]);

export const rflName = style({
  fontFamily: ZFB09,
  fontSize: '16px',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#000000AA',
});

export const rflPath = style({
  fontFamily: ZFB03B,
  fontSize: vars.text.md,
  color: '#00000030',
});
