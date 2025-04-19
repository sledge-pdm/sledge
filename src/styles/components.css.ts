import { style } from '@vanilla-extract/css'

export const flexCol = style({
  display: 'flex',
  flexDirection: 'column',
})

export const flexRow = style({
  display: 'flex',
  flexDirection: 'row',
})

export const w100 = style({
  width: '100%',
})

export const h100 = style({
  height: '100%',
})

export const wh100 = style([w100, h100])
