import { Size2D, Vec2 } from '@sledge/core';
import { fonts } from '@sledge/theme';
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { FrameHandles, FrameRect, OnCanvasFrameInteract } from '~/components/canvas/overlays/OnCanvasFrameInteract';
import { coordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { setInteractStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { CanvasPos } from '~/types/CoordinateTypes';

export const CanvasResizeFrame: Component = () => {
  const [rect, setRect] = createSignal<FrameRect | undefined>();
  const [start, setStart] = createSignal<Vec2 | undefined>();
  const [size, setSize] = createSignal<Size2D | undefined>();

  const screenBox = createMemo(() => {
    const r = rect();
    if (!r) return undefined;
    const topLeft = coordinateTransform.canvasToWindowForOverlay(CanvasPos.create(r.x, r.y));
    const bottomRight = coordinateTransform.canvasToWindowForOverlay(CanvasPos.create(r.x + r.width, r.y + r.height));

    return {
      start: { x: Math.min(topLeft.x, bottomRight.x), y: Math.min(topLeft.y, bottomRight.y) },
      size: { width: Math.abs(bottomRight.x - topLeft.x), height: Math.abs(bottomRight.y - topLeft.y) },
    };
  });

  createEffect(() => {
    const box = screenBox();
    if (box) {
      setStart(box.start);
      setSize(box.size);
    }
  });

  let svgEl: SVGSVGElement | undefined;
  let interact: OnCanvasFrameInteract | undefined;

  const setupInteract = () => {
    if (interact || !svgEl || !rect()) return; // 既に初期化済み or 条件未整備
    interact = new OnCanvasFrameInteract(svgEl, () => rect()!, {
      keepAspect: 'shift',
      snapToPixel: true,
      allowInvert: true,

      onChange: (r) => {
        // should process negative case properly
        if (r.width < 0) {
          r.width = Math.abs(r.width);
          r.x -= r.width; // idk if this works (may need to +1 or -1 but leave this as is)
        }
        if (r.height < 0) {
          r.height = Math.abs(r.height);
          r.y -= r.height; // idk if this works (may need to +1 or -1 but leave this as is)
        }
        setRect(r);
      },
    });
    interact.setInteractListeners();
  };

  onMount(() => {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    if (w > 0 && h > 0) {
      setRect({ x: 0, y: 0, width: w, height: h, rotation: 0 });
    }
    setupInteract();
  });

  onCleanup(() => {
    interact?.removeInteractListeners();
  });

  createEffect(() => {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    if (!rect() && w > 0 && h > 0) {
      setRect({ x: 0, y: 0, width: w, height: h, rotation: 0 });

      setupInteract();
    }
  });

  // 確定時に使用する整数キャンバスサイズとフレーム左上座標(startX,startY)を計算
  // - startX = floor(rect.x) / startY = floor(rect.y)
  // - endX = ceil(rect.x + rect.width) / endY = ceil(rect.y + rect.height)
  // => 新しいキャンバス幅/高さ = end - start (必ず整数, 選択領域を完全包含)
  // store にはフレーム左上の旧キャンバス座標 (startX,startY) をそのまま + 正符号で保持する。
  // commit 時に srcOrigin = (startX,startY), destOrigin = (0,0) でコピーし、(startX,startY) が新キャンバスの (0,0) に再基準化される。
  const logicalFrame = createMemo(() => {
    const r = rect();
    if (!r) return undefined;
    // フレーム矩形を整数化 (ドラッグ中も整数運用だが安全のため再適用)
    const startX = Math.floor(r.x);
    const startY = Math.floor(r.y);
    const endX = Math.ceil(r.x + r.width);
    const endY = Math.ceil(r.y + r.height);
    const canvasWidth = endX - startX;
    const canvasHeight = endY - startY;
    // offset はフレーム左上の旧キャンバス座標を正符号で持つ
    const offsetX = startX;
    const offsetY = startY;
    return { canvasWidth, canvasHeight, offsetX, offsetY };
  });

  // logicalFrame を store に同期 (commit UI 用)
  createEffect(() => {
    const lf = logicalFrame();
    if (!lf) return;
    setInteractStore('canvasSizeFrameOffset', { x: lf.offsetX, y: lf.offsetY }); // (startX,startY)
    setInteractStore('canvasSizeFrameSize', { width: lf.canvasWidth, height: lf.canvasHeight });
  });

  return (
    <>
      <Show when={start() !== undefined && size() !== undefined}>
        <svg
          ref={(el) => {
            svgEl = el as SVGSVGElement;
            // 参照が得られたタイミングでインタラクトを初期化
            setupInteract();
          }}
          xmlns='http://www.w3.org/2000/svg'
          style={{
            position: 'absolute',
            left: `${start()!.x}px`,
            top: `${start()!.y}px`,
            width: `${size()!.width}px`,
            height: `${size()!.height}px`,
            margin: 0,
            padding: 0,
            'image-rendering': 'pixelated',
            'shape-rendering': 'geometricPrecision',
            overflow: 'visible',
            'pointer-events': 'all',
          }}
        >
          <rect
            class={'drag-surface'}
            x={'0'}
            y={'0'}
            width={'100%'}
            height={'100%'}
            fill={'transparent'}
            pointer-events={'all'}
            style={{ cursor: 'move' }}
          />

          <rect
            class={'border-rect'}
            width={'100%'}
            height={'100%'}
            fill={'#00000080'}
            stroke='#808080'
            stroke-width={1}
            style={{
              'pointer-events': 'none',
            }}
          />

          <g font-size={16} style={{ 'font-family': fonts.ZFB08 }} fill='white' stroke='none'>
            <Show when={logicalFrame()}>
              <text x={8} y={20}>
                {logicalFrame()!.offsetX}, {logicalFrame()!.offsetY}
              </text>
            </Show>
          </g>

          <FrameHandles corner edge visible size={8} />
        </svg>
      </Show>
    </>
  );
};

export default CanvasResizeFrame;
