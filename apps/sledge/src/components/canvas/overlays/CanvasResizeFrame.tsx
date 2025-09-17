import { Size2D, Vec2 } from '@sledge/core';
import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { Consts } from '~/Consts';
import { canvasToScreen } from '~/features/canvas/CanvasPositionCalculator';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';

export const CanvasResizeFrame: Component = () => {
  const [start, setStart] = createSignal<Vec2 | undefined>();
  const [size, setSize] = createSignal<Size2D | undefined>();
  const recompute = () => {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    if (w === 0 || h === 0) return;
    const start = canvasToScreen({
      x: 0,
      y: 0,
    });
    setStart(start);
    const end = canvasToScreen({
      x: canvasStore.canvas.width,
      y: canvasStore.canvas.height,
    });
    setSize({
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    });

    console.log(start);
    console.log(start);
  };

  onMount(() => {
    recompute();
  });
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

  return (
    <>
      <Show when={start() !== undefined && size() !== undefined}>
        <div
          style={{
            position: 'absolute',

            left: `${start()!.x}px`,
            top: `${start()!.y}px`,

            width: `${size()!.width}px`,
            height: `${size()!.height}px`,

            'background-color': '#00000060',
            'z-index': Consts.zIndex.canvasResizeFrame,

            'pointer-events': 'all',
          }}
        />
      </Show>
    </>
  );
};

export default CanvasResizeFrame;
