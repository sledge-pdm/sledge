import { Size2D, Vec2 } from '@sledge/core';
import { fonts } from '@sledge/theme';
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { canvasToScreen } from '~/features/canvas/CanvasPositionCalculator';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import ResizeFrameInteract, { ResizeFrameRect } from './ResizeFrameInteract';

export const CanvasResizeFrame: Component = () => {
  // 編集中の矩形（キャンバス座標系）
  const [rect, setRect] = createSignal<ResizeFrameRect | undefined>();
  // 画面座標での表示開始位置とサイズ
  const [start, setStart] = createSignal<Vec2 | undefined>();
  const [size, setSize] = createSignal<Size2D | undefined>();

  const recomputeScreenBox = () => {
    const r = rect();
    if (!r) return;
    const s = canvasToScreen({ x: r.x, y: r.y });
    const e = canvasToScreen({ x: r.x + r.width, y: r.y + r.height });
    setStart(s);
    setSize({ width: Math.abs(e.x - s.x), height: Math.abs(e.y - s.y) });
  };

  // interact インスタンス保持
  let svgEl: SVGSVGElement | undefined;
  let interact: ResizeFrameInteract | undefined;

  const setupInteract = () => {
    if (interact || !svgEl || !rect()) return; // 既に初期化済み or 条件未整備
    interact = new ResizeFrameInteract(
      svgEl,
      () => rect()!,
      (r) => {
        setRect(r);
        recomputeScreenBox();
      },
      () => {
        /* commit は CanvasControls 側 */
      }
    );
    interact.setInteractListeners();
  };

  onMount(() => {
    // 初期矩形: 現在のキャンバスサイズ
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    if (w > 0 && h > 0) {
      setRect({ x: 0, y: 0, width: w, height: h });
      recomputeScreenBox();
    }
    setupInteract();
  });
  onCleanup(() => {
    interact?.removeInteractListeners();
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
    recomputeScreenBox();
  });
  // キャンバスサイズが外部変更された場合、未操作時のみ矩形を追従
  createEffect(() => {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    if (!rect() && w > 0 && h > 0) {
      setRect({ x: 0, y: 0, width: w, height: h });
      recomputeScreenBox();
      setupInteract();
    }
  });
  // saveRectToStore 削除: logicalFrame から同期する

  const Handle: Component<{ x: string; y: string; 'data-pos': string; size?: number }> = (props) => {
    // オーバーレイはスケールしないので、ズームのみ相殺
    const size = () => props.size ?? 8;
    return (
      <rect
        x={props.x}
        y={props.y}
        class={'resize-handle'}
        data-pos={props['data-pos']}
        width={size()}
        height={size()}
        stroke='#808080'
        fill='black'
        stroke-width={1}
        vector-effect={'non-scaling-stroke'}
        pointer-events='all'
        style={{
          cursor: `${props['data-pos']}-resize`,
          transform: `translate(-${size() / 2}px, -${size() / 2}px)`,
          position: 'absolute',
        }}
      />
    );
  };

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
          {/* 内部ドラッグ用の透明サーフェス */}
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
          {/* border rect */}
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
          {/* 情報表示: 1行目 = 表示上のピクセルサイズ (スクリーン), 2行目 = 論理キャンバスサイズ + オフセット */}
          <g font-size={16} style={{ 'font-family': fonts.ZFB08 }} fill='white' stroke='none'>
            <Show when={logicalFrame()}>
              <text x={8} y={20}>
                {logicalFrame()!.offsetX}, {logicalFrame()!.offsetY}
              </text>
            </Show>
          </g>
          {/* 四隅 */}
          <Handle x={'0'} y={'0'} data-pos='nw' />
          <Handle x={'100%'} y={'0'} data-pos='ne' />
          <Handle x={'100%'} y={'100%'} data-pos='se' />
          <Handle x={'0'} y={'100%'} data-pos='sw' />
          {/* 四辺 */}
          <Handle x={'50%'} y={'0'} data-pos='n' />
          <Handle x={'100%'} y={'50%'} data-pos='e' />
          <Handle x={'50%'} y={'100%'} data-pos='s' />
          <Handle x={'0'} y={'50%'} data-pos='w' />
        </svg>
      </Show>
    </>
  );
};

export default CanvasResizeFrame;
