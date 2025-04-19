export interface Tool {
  onStart?: (args: ToolArgs) => void

  onMove?: (args: ToolArgs) => void

  onEnd?: (args: ToolArgs) => void
}

export interface ToolArgs {
  image: ImageData
  x: number
  y: number
  lastX?: number
  lastY?: number
  color: [number, number, number, number] // RGBA
  // TODO: pressure, tilt, ...
}
