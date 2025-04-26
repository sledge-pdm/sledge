import { Canvas } from '~/types/Canvas'

export const createCanvas = (width = 800, height = 1200): Canvas => {
  return {
    width,
    height,
  }
}
