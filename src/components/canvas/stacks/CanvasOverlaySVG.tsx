import { Component, For } from 'solid-js';
import { activeLayer } from '~/controllers/layer_list/LayerListController';
import { currentTool as getCurrentTool } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalStore } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import Tile from '~/types/Tile';

const CanvasOverlaySVG: Component<{ dirtyRects?: Tile[] }> = (props) => {
  const borderWidth = () => canvasStore.canvas.width * interactStore.zoom;
  const borderHeight = () => canvasStore.canvas.height * interactStore.zoom;

  const zoomedPenSize = () => getCurrentTool().size * interactStore.zoom;

  const dirtyRects = () => (globalStore.showDirtyRects ? props.dirtyRects : []);

  return (
    <svg
      viewBox={`0 0 ${borderWidth()} ${borderHeight()}`}
      xmlns='http://www.w3.org/2000/svg'
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        'pointer-events': 'none',
        'image-rendering': 'pixelated',
        'z-index': 1000,
      }}
    >
      {/* border rect */}
      <rect
        width={borderWidth()}
        height={borderHeight()}
        fill='none'
        stroke='black'
        stroke-width={1}
        pointer-events='none'
      />

      {/* pen hover preview */}
      <rect
        width={zoomedPenSize()}
        height={zoomedPenSize()}
        x={Math.round(interactStore.lastMouseOnCanvas.x * interactStore.zoom) - zoomedPenSize() / 2}
        y={Math.round(interactStore.lastMouseOnCanvas.y * interactStore.zoom) - zoomedPenSize() / 2}
        fill='none'
        stroke='black'
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
