import { createStore } from 'solid-js/store'
import { createTool } from '~/models/factories/createPen'
import { ToolType } from '~/types/Tool'

export const [toolStore, setToolStore] = createStore({
  usingIndex: 0,
  tools: [
    createTool(ToolType.Pen, 'pen', 1),
    createTool(ToolType.Eraser, 'eraser', 1),
    createTool(ToolType.Fill, 'fill', 1),
  ],
})
export const currentTool = () => toolStore.tools[toolStore.usingIndex]
