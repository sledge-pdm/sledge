import { css } from '@acab/ecsstatic';
import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import { coordinateTransform, getDebugTransformInfo } from '~/features/canvas/transform/CanvasPositionCalculator';
import { logSystemWarn } from '~/features/log/service';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { CanvasPos, WindowPos } from '~/types/CoordinateTypes';

const debugOverlay = css`
  position: fixed;
  top: 140px;
  right: 40px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  border-radius: 4px;
  z-index: 10000;
  pointer-events: none;
  max-width: 400px;
  white-space: pre-wrap;
  z-index: 1000000;
`;

const coordinateDisplay = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  z-index: 1000000;
`;

const coordinateRow = css`
  display: flex;
  justify-content: space-between;
  gap: 12px;

  & > span {
    color: white;
  }
`;

const matrixDisplay = css`
  font-size: 10px;
  opacity: 0.7;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 8px;
`;

/**
 * 座標デバッグ表示コンポーネント
 * WindowPosとCanvasPosをリアルタイム表示
 */
const CoordinateDebugOverlay: Component = () => {
  const [mouseWindowPos, setMouseWindowPos] = createSignal<WindowPos>(WindowPos.create(0, 0));
  const [mouseCanvasPos, setMouseCanvasPos] = createSignal<CanvasPos>(CanvasPos.create(0, 0));
  const [mouseAreaPos, setMouseAreaPos] = createSignal<{ x: number; y: number }>({ x: 0, y: 0 });
  const [transformInfo, setTransformInfo] = createSignal<ReturnType<typeof getDebugTransformInfo>>();

  let updateInterval: number;
  let lastMouseMoveTime = 0;
  const MOUSE_UPDATE_THROTTLE = 16; // ~60fps

  const handleMouseMove = (e: MouseEvent) => {
    const now = Date.now();
    // マウス移動の更新を60fpsにスロットル
    if (now - lastMouseMoveTime < MOUSE_UPDATE_THROTTLE) return;
    lastMouseMoveTime = now;

    const windowPos = WindowPos.create(e.clientX, e.clientY);

    // 統合キャッシュシステムを使用してcanvas-area相対座標を計算
    const areaPos = coordinateTransform.getCanvasAreaCoords({ x: e.clientX, y: e.clientY });

    const canvasPos = coordinateTransform.windowToCanvas(windowPos);

    setMouseWindowPos(windowPos);
    setMouseAreaPos(areaPos);
    setMouseCanvasPos(canvasPos);
  };

  const updateTransformInfo = () => {
    try {
      const info = getDebugTransformInfo();
      setTransformInfo(info);
    } catch (error) {
      logSystemWarn('Failed to get transform info.', { label: 'CoordinateDebugOverlay', details: [error] });
    }
  };

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Transform情報をより控えめに更新（500ms間隔）
    updateTransformInfo();
    updateInterval = window.setInterval(updateTransformInfo, 500);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.clearInterval(updateInterval);
    };
  });

  onCleanup(() => {
    if (updateInterval) {
      window.clearInterval(updateInterval);
    }
  });

  return (
    <div class={debugOverlay}>
      <div class={coordinateDisplay}>
        <div class={coordinateRow}>
          <span>WindowPos:</span>
          <span>
            ({mouseWindowPos().x.toFixed(1)}, {mouseWindowPos().y.toFixed(1)})
          </span>
        </div>
        <div class={coordinateRow}>
          <span>AreaPos:</span>
          <span>
            ({mouseAreaPos().x.toFixed(1)}, {mouseAreaPos().y.toFixed(1)})
          </span>
        </div>
        <div class={coordinateRow}>
          <span>CanvasPos:</span>
          <span>
            ({mouseCanvasPos().x.toFixed(1)}, {mouseCanvasPos().y.toFixed(1)})
          </span>
        </div>
      </div>

      <div class={coordinateDisplay}>
        <div class={coordinateRow}>
          <span>Zoom:</span>
          <span>{(interactStore.zoom * 100).toFixed(1)}%</span>
        </div>
        <div class={coordinateRow}>
          <span>Rotation:</span>
          <span>{interactStore.rotation.toFixed(1)}°</span>
        </div>
        <div class={coordinateRow}>
          <span>Canvas Size:</span>
          <span>
            {canvasStore.canvas.width}×{canvasStore.canvas.height}
          </span>
        </div>
        <div class={coordinateRow}>
          <span>Offset:</span>
          <span>
            ({interactStore.offset.x.toFixed(1)}, {interactStore.offset.y.toFixed(1)})
          </span>
        </div>
        <div class={coordinateRow}>
          <span>OffsetOrigin:</span>
          <span>
            ({interactStore.offsetOrigin.x.toFixed(1)}, {interactStore.offsetOrigin.y.toFixed(1)})
          </span>
        </div>
        <div class={coordinateRow}>
          <span>Flipped:</span>
          <span>
            H:{interactStore.horizontalFlipped ? 'Y' : 'N'} V:{interactStore.verticalFlipped ? 'Y' : 'N'}
          </span>
        </div>
      </div>

      {transformInfo() && (
        <div class={matrixDisplay}>
          <div>Canvas Area Offset Test:</div>
          <div>
            Area(100,100) → Window({(100 + (transformInfo()?.canvasAreaRect?.left || 0)).toFixed(1)},{' '}
            {(100 + (transformInfo()?.canvasAreaRect?.top || 0)).toFixed(1)})
          </div>
          <div style='margin-top: 4px;'>Coordinate Transform Comparison:</div>
          <div style='font-size: 8px;'>
            canvasToWindow: ({transformInfo()?.testWindowPos.x.toFixed(1)}, {transformInfo()?.testWindowPos.y.toFixed(1)})
          </div>
          <div style='font-size: 8px;'>
            canvasToWindowForOverlay: ({transformInfo()?.testWindowPosOverlay.x.toFixed(1)}, {transformInfo()?.testWindowPosOverlay.y.toFixed(1)})
          </div>
          <div style='margin-top: 4px;'>Transform Matrix:</div>
          <div style='font-size: 8px;'>{transformInfo()?.matrix}</div>
        </div>
      )}
    </div>
  );
};

export default CoordinateDebugOverlay;
