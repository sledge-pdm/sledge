import { createStore } from 'solid-js/store'
import { createTool } from '~/models/factories/createPen'
import { ToolType } from '~/models/types/Tool'

export const [toolStore, setToolStore] = createStore({
  usingIndex: 0,
  tools: [
    createTool(ToolType.Pen, 'pen', 1, '#000000'),
    createTool(ToolType.Eraser, 'eraser', 4, 'none'),
    createTool(ToolType.Fill, 'fill', 4, '#FF0000'),
  ],
})
export const currentTool = () => toolStore.tools[toolStore.usingIndex]
