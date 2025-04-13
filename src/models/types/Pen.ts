import { penStore, setPenStore } from '~/stores/internal/penStore'

export type Pen = {
  id: string
  name: string
  size: number
  color: string
}

export const setCurrentPenColor = (colorHexString: string) => {
  return setPenStore('pens', penStore.usingIndex, 'color', colorHexString)
}
