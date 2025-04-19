import { style } from '@vanilla-extract/css'
import { flexCol, flexRow, h100, w100 } from '../components.css'
import { Terminus, vars } from '../global.css'

export const titleBarRoot = style([
  flexRow,
  w100,
  {
    background: '#fff',
    pointerEvents: 'all',
    height: '30px',
    borderBottom: '1px solid #aaa',
    alignItems: 'center',
  },
])

export const titleBarTitle = style([
  flexRow,
  w100,
  {
    fontFamily: Terminus,
    fontSize: vars.text.md,
    marginRight: 'auto',
    paddingLeft: vars.spacing.lg,
    pointerEvents: 'none',
  },
])

export const titleBarControls = style([flexRow, h100])

export const titleBarControlButton = style([
  flexCol,
  h100,
  {
    pointerEvents: 'none',
    alignItems: 'venter',
    background: 'none',
    border: 'none',
    fontSize: vars.text.xl,
    justifyContent: 'center',
    minWidth: '50px',
    ':hover': {
      backgroundColor: '#ddd',
    },
  },
])

export const titleBarControlCloseButton = style([
  titleBarControlButton,
  {
    ':hover': {
      backgroundColor: '#ff1010',
    },
  },
])
