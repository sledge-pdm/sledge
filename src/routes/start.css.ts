import { style } from '@vanilla-extract/css'
import { flexCol, flexRow, w100, wh100 } from '~/styles/components.css'
import { ZFB03B, ZFB09 } from '~/styles/global.css'

export const welcomeRoot = style([
  flexCol,
  wh100,
  {
    alignItems: 'center',
    justifyContent: 'center',
  },
])

export const welcomeHeadline = style({
  fontFamily: ZFB09,
  fontSize: '5rem',
  letterSpacing: '8px',
  marginBottom: '12px',
})

export const recentFilesCaption = style({
  fontFamily: ZFB03B,
  color: '#333',
  flexGrow: 1,
  marginBottom: '12px',
})

export const clear = style({
  color: '#777',
  fontFamily: ZFB03B,
})

export const recentFilesContainer = style([
  flexCol,
  w100,
  {
    gap: '8px',
    marginTop: '4px',
  },
])

export const recentFilesItem = style([
  flexRow,
  w100,
  {
    alignItems: 'center',
    gap: '8px',
  },
])

export const recentFilesName = style({
  fontFamily: ZFB09,
  fontSize: '0.5rem',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const recentFilesPath = style({
  fontFamily: ZFB03B,
  fontSize: '0.5rem',
  color: '#00000030',
})

export const sideSection = style([
  flexCol,
  {
    gap: '1rem',
    paddingBottom: '24px',
    paddingTop: '12px',
  },
])

export const sideSectionItem = style([
  flexCol,
  {
    cursor: 'pointer',
    fontSize: '1rem',
    width: 'fit-content',
    ':hover': {
      color: 'red',
    },
  },
])
