export interface RulerMark {
  /** Position in ruler-local pixels */
  position: number;
  /** Raw canvas coordinate */
  canvasPosition: number;
  /** Optional label text */
  label: string;
  /** Whether the mark is a major tick */
  isMajor: boolean;
}

export interface RulerCalculationResult {
  horizontalMarks: RulerMark[];
  verticalMarks: RulerMark[];
  startCanvasX: number;
  startCanvasY: number;
  endCanvasX: number;
  endCanvasY: number;
}

export interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RulerCalculationContext {
  zoom: number;
  offsetX: number;
  offsetY: number;
  offsetOriginX: number;
  offsetOriginY: number;
  horizontalFlipped: boolean;
  verticalFlipped: boolean;
  canvasWidth: number;
  canvasHeight: number;
  sectionsRect: RectSnapshot | null;
  canvasAreaRect: RectSnapshot | null;
}

const EMPTY_RESULT: RulerCalculationResult = {
  horizontalMarks: [],
  verticalMarks: [],
  startCanvasX: 0,
  startCanvasY: 0,
  endCanvasX: 0,
  endCanvasY: 0,
};

function getMarkInterval(zoom: number): { majorInterval: number; minorInterval: number } {
  if (zoom >= 24) return { majorInterval: 5, minorInterval: 1 };
  if (zoom >= 8) return { majorInterval: 10, minorInterval: 1 };
  if (zoom >= 4) return { majorInterval: 20, minorInterval: 5 };
  if (zoom >= 2) return { majorInterval: 50, minorInterval: 10 };
  if (zoom >= 1) return { majorInterval: 100, minorInterval: 20 };
  if (zoom >= 0.5) return { majorInterval: 200, minorInterval: 50 };
  if (zoom >= 0.25) return { majorInterval: 500, minorInterval: 100 };
  return { majorInterval: 1000, minorInterval: 200 };
}

function createNoRotationTransform(context: RulerCalculationContext) {
  const Matrix = globalThis.DOMMatrix ?? (globalThis as any).WebKitCSSMatrix;
  if (!Matrix) {
    return { forward: new DOMMatrix(), inverse: new DOMMatrix() };
  }

  const cx = context.canvasWidth / 2;
  const cy = context.canvasHeight / 2;
  const sx = context.horizontalFlipped ? -1 : 1;
  const sy = context.verticalFlipped ? -1 : 1;
  const totalOffsetX = context.offsetOriginX + context.offsetX;
  const totalOffsetY = context.offsetOriginY + context.offsetY;

  const matrix = new Matrix().translate(totalOffsetX, totalOffsetY).scale(context.zoom).translate(cx, cy).rotate(0).scale(sx, sy).translate(-cx, -cy);

  return {
    forward: matrix,
    inverse: matrix.inverse(),
  };
}

function generateMarks(
  start: number,
  end: number,
  majorInterval: number,
  minorInterval: number,
  axis: 'horizontal' | 'vertical',
  context: RulerCalculationContext,
  transform: { forward: DOMMatrix }
): RulerMark[] {
  if (!context.sectionsRect || !context.canvasAreaRect) return [];

  const marks: RulerMark[] = [];
  const startMinor = Math.floor(start / minorInterval) * minorInterval;
  const endMinor = Math.ceil(end / minorInterval) * minorInterval;

  for (let canvasPos = startMinor; canvasPos <= endMinor; canvasPos += minorInterval) {
    const isMajor = canvasPos % majorInterval === 0;
    const canvasPoint = axis === 'horizontal' ? new DOMPoint(canvasPos, 0) : new DOMPoint(0, canvasPos);
    const relative = transform.forward.transformPoint(canvasPoint);
    const windowX = context.canvasAreaRect.left + relative.x;
    const windowY = context.canvasAreaRect.top + relative.y;
    const position = axis === 'horizontal' ? windowX - context.sectionsRect.left : windowY - context.sectionsRect.top;

    marks.push({
      position,
      canvasPosition: canvasPos,
      label: isMajor ? canvasPos.toString() : '',
      isMajor,
    });
  }

  return marks;
}

export function calculateRulerMarks(context: RulerCalculationContext): RulerCalculationResult {
  if (!context.sectionsRect || !context.canvasAreaRect) {
    return EMPTY_RESULT;
  }

  const containerWidth = context.sectionsRect.width || 0;
  const containerHeight = context.sectionsRect.height || 0;
  const transform = createNoRotationTransform(context);

  const toCanvasPoint = (x: number, y: number) => {
    const windowX = context.sectionsRect!.left + x;
    const windowY = context.sectionsRect!.top + y;
    const canvasRelativeX = windowX - context.canvasAreaRect!.left;
    const canvasRelativeY = windowY - context.canvasAreaRect!.top;
    const result = transform.inverse.transformPoint(new DOMPoint(canvasRelativeX, canvasRelativeY));
    return { x: result.x, y: result.y };
  };

  const topLeft = toCanvasPoint(0, 0);
  const topRight = toCanvasPoint(containerWidth, 0);
  const bottomLeft = toCanvasPoint(0, containerHeight);
  const bottomRight = toCanvasPoint(containerWidth, containerHeight);

  const startCanvasX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
  const endCanvasX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
  const startCanvasY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
  const endCanvasY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);

  const { majorInterval, minorInterval } = getMarkInterval(context.zoom);
  const horizontalMarks = generateMarks(startCanvasX, endCanvasX, majorInterval, minorInterval, 'horizontal', context, transform);
  const verticalMarks = generateMarks(startCanvasY, endCanvasY, majorInterval, minorInterval, 'vertical', context, transform);

  return {
    horizontalMarks,
    verticalMarks,
    startCanvasX,
    startCanvasY,
    endCanvasX,
    endCanvasY,
  };
}

export function isInViewport(context: RulerCalculationContext, canvasX: number, canvasY: number): boolean {
  const result = calculateRulerMarks(context);
  return canvasX >= result.startCanvasX && canvasX <= result.endCanvasX && canvasY >= result.startCanvasY && canvasY <= result.endCanvasY;
}
