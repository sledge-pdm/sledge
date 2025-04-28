import { Component, For } from 'solid-js';
import { activeLayer } from '~/controllers/layer_list/LayerListController';
import { currentTool } from '~/stores/editor/ToolsStore';
import { globalStore } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/project/canvasStore';
import Tile from '~/types/Tile';

const CanvasOverlaySVG: Component<{ dirtyRects?: Tile[] }> = (props) => {
  const borderWidth = () => canvasStore.canvas.width * canvasStore.zoom;
  const borderHeight = () => canvasStore.canvas.height * canvasStore.zoom;

  const zoomedPenSize = () => currentTool().size * canvasStore.zoom;

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
        x={
          Math.round(canvasStore.lastMouseOnCanvas.x * canvasStore.zoom) -
          zoomedPenSize() / 2
        }
        y={
          Math.round(canvasStore.lastMouseOnCanvas.y * canvasStore.zoom) -
          zoomedPenSize() / 2
        }
        fill='none'
        stroke='black'
        stroke-width={1}
        pointer-events='none'
      />

      <For each={dirtyRects()}>
        {(dirtyRect) => {
          return (
            <rect
              width={
                dirtyRect.globalTileSize *
                activeLayer()?.dotMagnification *
                canvasStore.zoom
              }
              height={
                dirtyRect.globalTileSize *
                activeLayer()?.dotMagnification *
                canvasStore.zoom
              }
              x={
                dirtyRect.getOffset().x *
                activeLayer()?.dotMagnification *
                canvasStore.zoom
              }
              y={
                dirtyRect.getOffset().y *
                activeLayer()?.dotMagnification *
                canvasStore.zoom
              }
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
