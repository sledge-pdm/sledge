import { style } from '@vanilla-extract/css'
import { flexCol } from '../../components.css'

export const canvasArea = style([
  flexCol,
  {
    backgroundColor: '#fcfcfc',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
])
