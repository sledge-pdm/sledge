import { Component, For } from 'solid-js';
import { layerImageManager } from './stacks/CanvasStack';
import { canvasStore } from '~/stores/project/canvasStore';
import { activeLayer } from '~/stores/project/layerStore';

const CanvasDebugOverlay: Component = () => {
  // const zoom = () => canvasStore.zoom;
  const lastMouseWindow = () => canvasStore.lastMouseWindow;
  const lastMouseOnCanvas = () => canvasStore.lastMouseOnCanvas;
  return (
    <div>
      <p>canvas.</p>
      <p>
        ({lastMouseWindow().x}, {lastMouseWindow().y}) ON WINDOW.
      </p>
      <p>
        ({lastMouseOnCanvas().x}, {lastMouseOnCanvas().y}) ON CANVAS.
      </p>
      {/* <p>x{zoom().toFixed(2)}</p> */}
      <p>active: {activeLayer()?.name}</p>
      <p>
        offset:({canvasStore.offset.x}, {canvasStore.offset.y})
      </p>
      <p>zoom.</p>
      <p>x {canvasStore.zoom}</p>

      <p>UNDO STACKS.</p>
      <For
        each={layerImageManager
          .getAgent(activeLayer()?.id)
          ?.getHistoryManager()
          ?.getUndoStack()}
      >
        {(item, i) => {
          if (i() === 0) {
            <>
              <p>
                pixel diffs:{' '}
                {
                  item.diffs
                    .values()
                    .toArray()
                    .filter((d) => d.kind === 'pixel').length
                }
                px.
              </p>
              <p>
                tile diffs:{' '}
                {
                  item.diffs
                    .values()
                    .toArray()
                    .filter((d) => d.kind === 'tile').length
                }
                px.
              </p>
            </>;
          } else return <></>;
        }}
      </For>
    </div>
  );
};

export default CanvasDebugOverlay;
