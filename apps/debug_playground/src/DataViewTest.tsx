import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { JSWrapperRgbaBuffer } from '~/models/JSWrapperRgbaBuffer';
import { RgbaBuffer } from '../../../packages/anvil/src/wasm/pkg/anvil_wasm';

type RGBA = [number, number, number, number];

const SIZE = { width: 128, height: 128 };

const toImageData = (view: Uint8ClampedArray, width: number, height: number) => new ImageData(new Uint8ClampedArray(view), width, height);

const drawToCanvas = (canvas: HTMLCanvasElement | undefined, data: Uint8ClampedArray, width: number, height: number) => {
  if (!canvas) return;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = toImageData(data, width, height);
  ctx.putImageData(imageData, 0, 0);
};

export const DataViewTest = () => {
  // JS wrapper (従来版)
  const jsWrapper = new JSWrapperRgbaBuffer(SIZE.width, SIZE.height, undefined);
  // WASM 直接版
  const wasmBuffer = new RgbaBuffer(SIZE.width, SIZE.height);

  const [jsColor, setJsColor] = createSignal<RGBA>([255, 0, 0, 255]);
  const [wasmColor, setWasmColor] = createSignal<RGBA>([0, 255, 0, 255]);
  let jsCanvas: HTMLCanvasElement | undefined;
  let wasmCanvas: HTMLCanvasElement | undefined;

  const fillWrapper = () => {
    jsWrapper.fill(jsColor());
    drawToCanvas(jsCanvas, jsWrapper.data, jsWrapper.width, jsWrapper.height);
  };

  const fillWasmViaJSView = () => {
    // 直接 data() を叩いて JS から書き込むパス
    const data = wasmBuffer.data();
    const [r, g, b, a] = wasmColor();
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
    drawToCanvas(wasmCanvas, wasmBuffer.data(), wasmBuffer.width(), wasmBuffer.height());
  };

  const fillWasmNative = () => {
    // WASM の fillAllCodes を使うパス (コード値で指定)
    wasmBuffer.fillAllCodes(255);
    drawToCanvas(wasmCanvas, wasmBuffer.data(), wasmBuffer.width(), wasmBuffer.height());
  };

  const randomDot = () => {
    // 両者にランダムドットを打つ
    const [r, g, b, a] = [Math.random() * 255, Math.random() * 255, Math.random() * 255, 255] as RGBA;
    jsWrapper.set(Math.floor(Math.random() * jsWrapper.width), Math.floor(Math.random() * jsWrapper.height), [r, g, b, a]);
    const wasmData = wasmBuffer.data();
    const wx = Math.floor(Math.random() * wasmBuffer.width());
    const wy = Math.floor(Math.random() * wasmBuffer.height());
    const widx = (wy * wasmBuffer.width() + wx) * 4;
    wasmData[widx] = r;
    wasmData[widx + 1] = g;
    wasmData[widx + 2] = b;
    wasmData[widx + 3] = a;
    drawToCanvas(jsCanvas, jsWrapper.data, jsWrapper.width, jsWrapper.height);
    drawToCanvas(wasmCanvas, wasmBuffer.data(), wasmBuffer.width(), wasmBuffer.height());
  };

  onMount(() => {
    fillWrapper();
    fillWasmViaJSView();
  });

  createEffect(() => {
    // 画面の初期描画・色変更時に再描画
    drawToCanvas(jsCanvas, jsWrapper.data, jsWrapper.width, jsWrapper.height);
    drawToCanvas(wasmCanvas, wasmBuffer.data(), wasmBuffer.width(), wasmBuffer.height());
  });

  onCleanup(() => {
    wasmBuffer.free?.();
  });

  return (
    <div style={{ display: 'flex', gap: '16px', 'align-items': 'flex-start', 'font-family': 'sans-serif' }}>
      <div>
        <h3>JS Wrapper (DataView refresh)</h3>
        <canvas ref={(el) => (jsCanvas = el)} style={{ border: '1px solid #ccc' }} />
        <div style={{ margin: '8px 0' }}>
          <button onClick={fillWrapper}>JS fill()</button>
        </div>
        <div>
          <label>Color RGBA </label>
          <input
            type='color'
            value={`#${jsColor()
              .slice(0, 3)
              .map((c) => c.toString(16).padStart(2, '0'))
              .join('')}`}
            onInput={(e) => {
              const hex = e.currentTarget.value;
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              setJsColor([r, g, b, 255]);
            }}
          />
        </div>
      </div>

      <div>
        <h3>WASM Buffer (data() 直接)</h3>
        <canvas ref={(el) => (wasmCanvas = el)} style={{ border: '1px solid #ccc' }} />
        <div style={{ margin: '8px 0', display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
          <button onClick={fillWasmViaJSView}>Fill via JS view write</button>
          <button onClick={fillWasmNative}>Fill via WASM fillAllCodes</button>
        </div>
        <div>
          <label>Color RGBA </label>
          <input
            type='color'
            value={`#${wasmColor()
              .slice(0, 3)
              .map((c) => c.toString(16).padStart(2, '0'))
              .join('')}`}
            onInput={(e) => {
              const hex = e.currentTarget.value;
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              setWasmColor([r, g, b, 255]);
            }}
          />
        </div>
      </div>

      <div>
        <h3>Both</h3>
        <button onClick={randomDot}>Random dot (both)</button>
        <p style={{ 'max-width': '220px', 'font-size': '12px', color: '#555' }}>
          JS wrapperは refreshDataView を通じてビューを維持。WASM 直接は data() の生ビューを書き換え。fill 操作や resize
          を追加して挙動を確認してください。
        </p>
      </div>
    </div>
  );
};
