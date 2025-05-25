import { Component, createEffect, createSignal, For } from 'solid-js';
import { activeLayer } from '~/controllers/layer/LayerListController';
import { getCurrentTool } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { vars } from '~/styles/global.css';
import Tile from '~/types/Tile';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CanvasOverlaySVG: Component<{ dirtyRects?: Tile[] }> = (props) => {
  const borderWidth = () => canvasStore.canvas.width * interactStore.zoom;
  const borderHeight = () => canvasStore.canvas.height * interactStore.zoom;

  const [areaPenWrite, setAreaPenWrite] = createSignal<Area>();
  createEffect(() => {
    const half = Math.floor(getCurrentTool().size / 2);
    let x = Math.floor(interactStore.lastMouseOnCanvas.x) - half;
    let y = Math.floor(interactStore.lastMouseOnCanvas.y) - half;
    let size = 1 + half * 2; // -half ~ half

    x *= interactStore.zoom;
    y *= interactStore.zoom;
    size *= interactStore.zoom;

    setAreaPenWrite({
      x,
      y,
      width: size,
      height: size,
    });
  });

  const dirtyRects = () => (globalConfig.debug.showDirtyRects ? props.dirtyRects : []);

  return (
    <svg
      viewBox={`0 0 ${borderWidth()} ${borderHeight()}`}
      xmlns='http://www.w3.org/2000/svg'
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        'pointer-events': 'none',
        'shape-rendering': 'auto',
        'z-index': 150,
      }}
    >
      {/* border rect */}
      <rect width={borderWidth()} height={borderHeight()} fill='none' stroke='black' stroke-width={1} pointer-events='none' />

      {/* pen hover preview */}
      <rect
        width={areaPenWrite()?.width}
        height={areaPenWrite()?.height}
        x={areaPenWrite()?.x}
        y={areaPenWrite()?.y}
        fill='none'
        stroke={vars.color.border}
        stroke-width={1}
        pointer-events='none'
      />

      <For each={dirtyRects()}>
        {(dirtyRect) => {
          return (
            <rect
              width={dirtyRect.globalTileSize * activeLayer()?.dotMagnification * interactStore.zoom}
              height={dirtyRect.globalTileSize * activeLayer()?.dotMagnification * interactStore.zoom}
              x={dirtyRect.getOffset().x * activeLayer()?.dotMagnification * interactStore.zoom}
              y={dirtyRect.getOffset().y * activeLayer()?.dotMagnification * interactStore.zoom}
              fill={dirtyRect.isDirty ? '#ff000060' : '#00ffff60'}
              stroke='none'
              pointer-events='none'
            />
          );
        }}
      </For>
    </svg>
  );
};

export default CanvasOverlaySVG;
