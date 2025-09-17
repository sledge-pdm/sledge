import { Vec2 } from '@sledge/core';
import { Component, createEffect, createSignal, JSX, onCleanup, onMount } from 'solid-js';
import { canvasToScreenNoZoom } from '~/features/canvas/CanvasPositionCalculator';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

/**
 * (0,0) と (width,height) の見かけ上の位置を目視検証するための簡易デバッグマーカー。
 * rotate / flip / zoom / offset 変更に追従。
 * 必要なくなったら削除して OK。
 */
const CornerDebugMarkers: Component = () => {
  const [positions, setPositions] = createSignal<{ tl: Vec2; cc: Vec2 | null; br: Vec2 | null }>({
    tl: { x: 0, y: 0 },
    cc: null,
    br: null,
  });

  const recompute = () => {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    if (w === 0 || h === 0) return;
    const tl = canvasToScreenNoZoom({ x: 0, y: 0 });
    const cc = canvasToScreenNoZoom({ x: w / 2, y: h / 2 });
    const br = canvasToScreenNoZoom({ x: w, y: h });
    setPositions({ tl, cc, br });
  };

  onMount(() => {
    recompute();
    const update = () => recompute();
    eventBus.on('canvas:sizeChanged', update);
    eventBus.on('canvas:onZoomChanged', update);
    eventBus.on('canvas:onAdjusted', update);
    // rotation / flip / offset は interactStore の signal 変化を watch
    createEffect(() => {
      // 参照して依存関係を張るだけ
      interactStore.offset.x;
      interactStore.offset.y;
      interactStore.rotation;
      interactStore.horizontalFlipped;
      interactStore.verticalFlipped;
      interactStore.zoom;
      recompute();
    });
  });

  onCleanup(() => {
    eventBus.off('canvas:sizeChanged');
    eventBus.off('canvas:onZoomChanged');
    eventBus.off('canvas:onAdjusted');
  });

  const markerStyle = (c: { x: number; y: number }): JSX.CSSProperties => ({
    position: 'absolute',
    left: `${c.x - 4}px`,
    top: `${c.y - 4}px`,
    width: '8px',
    height: '8px',
    'border-radius': '50%',
    'background-color': '#ff3366',
    'box-shadow': '0 0 2px #000',
    'pointer-events': 'none',
    'z-index': 999999,
  });

  const markerStyleBR = (c: { x: number; y: number }): JSX.CSSProperties => ({
    position: 'absolute',
    left: `${c.x - 4}px`,
    top: `${c.y - 4}px`,
    width: '8px',
    height: '8px',
    'border-radius': '50%',
    'background-color': '#33aaff',
    'box-shadow': '0 0 2px #000',
    'pointer-events': 'none',
    'z-index': 999999,
  });

  return (
    <div style={{ position: 'absolute', inset: 0, 'pointer-events': 'none' }}>
      <div style={markerStyle(positions().tl)} title='canvas (0,0)' />
      {positions().cc && <div style={markerStyle(positions().cc!)} title='canvas (width/2,height/2)' />}
      {positions().br && <div style={markerStyleBR(positions().br!)} title='canvas (width,height)' />}
    </div>
  );
};

export default CornerDebugMarkers;
