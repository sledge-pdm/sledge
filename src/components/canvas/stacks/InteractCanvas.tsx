import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import LayerCanvasOperator from '~/controllers/canvas/LayerCanvasOperator';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { DrawState } from '~/types/DrawState';
import { Vec2 } from '~/types/Vector';

interface Props {
  operator: LayerCanvasOperator;
}

// レイヤーごとのキャンバスの上でタッチイベントを受けるだけのキャンバス
export const InteractCanvas: Component<Props> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;

  const styleWidth = () => canvasStore.canvas.width;
  const styleHeight = () => canvasStore.canvas.height;

  const [lastPos, setLastPos] = createSignal<Vec2 | undefined>(undefined);
  const [temporaryOut, setTemporaryOut] = createSignal(false);

  function getOffset() {
    const rect = canvasRef!.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  function getWindowMousePosition(e: MouseEvent | PointerEvent | TouchEvent) {
    let x = 0;
    let y = 0;

    if ('clientX' in e && 'clientY' in e) {
      x = e.clientX;
      y = e.clientY;
    } else if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }
    return { x, y };
  }

  function getCanvasMousePosition(e: MouseEvent | PointerEvent | TouchEvent) {
    const offset = getOffset();

    let x = 0;
    let y = 0;

    if ('clientX' in e && 'clientY' in e) {
      x = e.clientX;
      y = e.clientY;
    } else if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    const zoom = interactStore.zoom;

    return {
      x: (x - offset.x) / zoom,
      y: (y - offset.y) / zoom,
    };
  }

  function isDrawableClick(e: PointerEvent): boolean {
    if (e.pointerType === 'touch' || e.ctrlKey) return false;
    // right=1, left=2, middle=4
    // console.log(e.buttons)
    if ((e.pointerType === 'mouse' || e.pointerType === 'pen') && e.buttons !== 1) return false;

    return true;
  }

  function handlePointerDown(e: PointerEvent) {
    if (!isDrawableClick(e)) return;

    const position = getCanvasMousePosition(e);
    props.operator.handleDraw(DrawState.start, position, lastPos());
    setInteractStore('isInStroke', true);
    setLastPos(position);
  }

  function handlePointerCancel(e: PointerEvent) {
    endStroke(getCanvasMousePosition(e));
  }

  function handlePointerMove(e: PointerEvent) {
    const windowPosition = getWindowMousePosition(e);
    const position = getCanvasMousePosition(e);
    setInteractStore('lastMouseWindow', windowPosition);
    setInteractStore('lastMouseOnCanvas', position);

    if (!isDrawableClick(e)) return;

    // 押したまま外に出てから戻ってきたときはそこから再開
    if (temporaryOut()) {
      setTemporaryOut(false);
      setInteractStore('isInStroke', true);
      setLastPos(position);
    }
    if (!interactStore.isInStroke || !lastPos()) return;

    props.operator.handleDraw(DrawState.move, position, lastPos());
    setLastPos(position);
  }

  function handlePointerUp(e: PointerEvent) {
    const position = getCanvasMousePosition(e);
    props.operator.handleDraw(DrawState.end, position, lastPos());
    if (interactStore.isInStroke) endStroke(position);
  }

  function handlePointerOut(e: PointerEvent) {
    // 出た時点でストロークを切る場合
    // const position = getCanvasMousePosition(e);
    // if (interactStore.isInStroke) endStroke(position);

    // 出た時点でも押したままキャンバス内に戻ってきたらストロークを再開する場合
    if (interactStore.isDragging && isDrawableClick(e)) {
      const position = getCanvasMousePosition(e);
      props.operator.handleDraw(DrawState.move, position, lastPos());
      setTemporaryOut(true);
    }
  }

  function handleWheel(e: WheelEvent) {
    const windowPosition = getWindowMousePosition(e);
    const position = getCanvasMousePosition(e);
    setInteractStore('lastMouseWindow', windowPosition);
    setInteractStore('lastMouseOnCanvas', position);
  }

  function endStroke(position: Vec2) {
    setInteractStore('isInStroke', false);
    setLastPos(undefined);
    setTemporaryOut(false);
  }

  onMount(() => {
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointercancel', handlePointerCancel);
    window.addEventListener('wheel', handleWheel);
  });

  onCleanup(() => {
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointercancel', handlePointerCancel);
    window.removeEventListener('wheel', handleWheel);
  });

  return (
    <canvas
      ref={(el) => {
        canvasRef = el;
      }}
      width={canvasStore.canvas.width}
      height={canvasStore.canvas.height}
      onPointerDown={handlePointerDown}
      onPointerOut={handlePointerOut}
      style={{
        'touch-action': 'none',
        width: `${styleWidth()}px`,
        height: `${styleHeight()}px`,
        'pointer-events': 'all',
        'z-index': '100', // どのレイヤーよりも上だが、image poolよりも下
      }}
    />
  );
};
