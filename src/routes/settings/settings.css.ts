import { style } from '@vanilla-extract/css'
import { k12x8, Terminus, vars, ZFB03, ZFB08, ZFB31 } from '~/styles/global.css'
import { flexCol } from '~/styles/snippets.css'

export const settingContainer = style([
  flexCol,
  {
    padding: vars.spacing.lg,
  },
])
