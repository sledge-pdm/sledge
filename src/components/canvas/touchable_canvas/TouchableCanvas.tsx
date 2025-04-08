import { Component, onMount, onCleanup, createSignal, } from "solid-js";
import { layerStore, canvasStore, setMetricStore, } from "~/stores/Store";
import { redo, undo, } from "~/models/layer/history";
import { roundPosition } from "~/utils/MetricUtils";

interface Props {
    zoom: number;
    onStrokeStart?: (position: { x: number, y: number }, lastPos?: { x: number, y: number }) => void;
    onStrokeMove?: (position: { x: number, y: number }, lastPos?: { x: number, y: number }) => void;
    onStrokeEnd?: (position: { x: number, y: number }, lastPos?: { x: number, y: number }) => void;
}

// レイヤーごとのキャンバスの上でタッチイベントを受けるだけのキャンバス
export const TouchableCanvas: Component<Props> = (props) => {
    let canvasRef: HTMLCanvasElement | undefined;

    const styleWidth = () => canvasStore.canvas.width * props.zoom;
    const styleHeight = () => canvasStore.canvas.height * props.zoom;

    const [isInStroke, setIsInStroke] = createSignal(false);
    const [lastPos, setLastPos] = createSignal<{ x: number, y: number } | undefined>(undefined);
    const [temporaryOut, setTemporaryOut] = createSignal(false);

    function getOffset() {
        const rect = canvasRef!.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    }

    function getCanvasMousePosition(e: MouseEvent) {
        const offset = getOffset();
        return {
            x: (e.clientX - offset.x) / props.zoom,
            y: (e.clientY - offset.y) / props.zoom
        };
    }

    function isPositionOnCanvas(position: { x: number, y: number }) {
        if (position.x < 0 || styleWidth() < position.x || position.y < 0 || styleHeight() < position.y) return false;
        else return true;
    }

    function handlePointerDown(e: PointerEvent) {
        const position = getCanvasMousePosition(e);
        if (props.onStrokeStart) {
            props.onStrokeStart(position, lastPos());
        }
        setIsInStroke(true);
        setLastPos(position);
    }

    function handlePointerMove(e: PointerEvent) {
        const position = getCanvasMousePosition(e);
        setMetricStore("lastMouseCanvas", roundPosition(position));
        // 押したまま外に出てから戻ってきたときはそこから再開
        if (temporaryOut()) {
            setTemporaryOut(false);
            setIsInStroke(true);
            setLastPos(position);
        }
        if (!isInStroke() || !lastPos()) return;

        if (props.onStrokeMove) {
            props.onStrokeMove(position, lastPos());
        }
        setLastPos(position);
    }

    function handlePointerUp(e: MouseEvent) {
        const position = getCanvasMousePosition(e);
        if (isInStroke()) endStroke(position);
    }

    function handlePointerOut(e: MouseEvent) {
        // 出た時点でストロークを切る場合
        // const position = getCanvasMousePosition(e);
        // if (isInStroke()) endStroke(position);

        // 出た時点でも押したままキャンバス内に戻ってきたらストロークを再開する場合
        const position = getCanvasMousePosition(e);
        if (props.onStrokeMove) {
            // 最後の位置を通知
            props.onStrokeMove(position, lastPos());
        }
        setTemporaryOut(true);
    }

    function endStroke(position: { x: number, y: number }) {
        if (props.onStrokeEnd) {
            props.onStrokeEnd(position, lastPos());
        }
        setIsInStroke(false);
        setLastPos(undefined);
        setTemporaryOut(false);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.ctrlKey && e.key === "z") {
            undo(layerStore.activeLayerId);
        } else if (e.ctrlKey && e.key === "y") {
            redo(layerStore.activeLayerId);
        }
    }

    onMount(() => {
        window.addEventListener("pointerup", handlePointerUp)
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("keydown", handleKeydown);
    });

    onCleanup(() => {
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("keydown", handleKeydown);
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
                width: `${styleWidth()}px`,
                height: `${styleHeight()}px`,
                "pointer-events": "all",
                "z-index": "100" // どのレイヤーよりも上だが、image poolよりも下
            }}
        />
    );
};
