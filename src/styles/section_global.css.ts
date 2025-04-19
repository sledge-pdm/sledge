import { style } from '@vanilla-extract/css'
import { flexCol, w100 } from './components.css'
import { vars, ZFB11 } from './global.css'

export const sectionRoot = style([
  flexCol,
  {
    // border: '1px solid black',
  },
])

export const sectionCaption = style({
  fontFamily: ZFB11,
  fontSize: vars.text.xs,
  marginBottom: vars.spacing.md,
})

export const sectionContent = style([flexCol, w100])
