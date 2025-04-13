import { createStore } from 'solid-js/store'

// color

export const [colorStore, setColorStore] = createStore({
  swatches: [
    '#000000',
    '#FFFFFF',
    '#ffff00',
    '#00ffff',
    '#00ff00',
    '#ff00ff',
    '#ff0000',
    '#0000ff',
    '#000080',
    '#400080',
  ],
})
