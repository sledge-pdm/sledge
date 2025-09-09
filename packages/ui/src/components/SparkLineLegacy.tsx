import { vars } from '@sledge/theme';
import { type Component, createSignal, onCleanup, onMount } from 'solid-js';

interface SparkLineProps {
  /** 横ピクセル数＝バッファ長 */
  width: number;
  /** 縦ピクセル数 */
  height: number;
  /** 新しいサンプルを返す非同期関数 */
  fetchSample: () => Promise<number | undefined>;
  /** ミリ秒 */
  interval?: number;
  /** 線の色 */
  color?: string;
  suffix?: string;
  initialMaxValue?: number;
  /** 表示・サンプリングの有効化（デフォルト true） */
  enabled?: boolean;
  /** 起動時にサンプリングを遅らせる(ms)。デフォルト 800ms */
  startDelayMs?: number;
}

export const SparkLineLegacy: Component<SparkLineProps> = (props) => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  // width ピクセル分のバッファをゼロ埋め
  const buffer: number[] = Array(props.width).fill(0);
  const [lastBuffer, setLastBuffer] = createSignal<number | undefined>(-1);
  const [maxValue, setMaxValue] = createSignal(1);

  let iv: number | undefined;
  let startTimer: number | undefined;
  let rafId: number | undefined;
  let inFlight = false;
  const isEnabled = () => props.enabled ?? true;
  const startDelay = props.startDelayMs ?? 800;

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    // ピクセルパーフェクトを狙うなら、実際の canvas.width/height と CSSサイズを同じに
    canvas.width = props.width;
    canvas.height = props.height;

    // 描画関数：バッファ全部を１ドットずつ打っていく（rAFでスケジュール）
    const draw = () => {
      // クリア
      ctx.clearRect(0, 0, props.width, props.height);
      ctx.fillStyle = props.color || 'lime';

      for (let x = 0; x < buffer.length; x++) {
        // 0〜maxValue を 0〜(height-1) に丸め込む
        const q = Math.round((buffer[x] / maxValue()) * (props.height - 1));
        // 底辺を y=height-1 として上向きに描画
        const y = props.height - 1 - q;
        ctx.fillRect(x, y, 1, 1);
      }
    };

    const tick = async () => {
      if (!isEnabled() || document.hidden || inFlight) return;
      inFlight = true;
      try {
        const v = await props.fetchSample();
        buffer.shift();
        buffer.push(v ?? 0);
        setLastBuffer(v ? Math.round(v * 10) / 10 : undefined);
        const bufMax = Math.max(...buffer);
        const newMax = Math.max(bufMax * 1.5, props.initialMaxValue ?? 0);
        setMaxValue(Math.round(newMax * 10) / 10);
        // 描画はrAFで合流
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(draw);
      } catch {
        // ignore
      } finally {
        inFlight = false;
      }
    };

    const start = () => {
      if (!isEnabled()) return;
      if (iv) clearInterval(iv);
      iv = setInterval(tick, props.interval ?? 1000) as unknown as number;
    };

    // 起動直後の競合を避けるため少し遅延して開始
    startTimer = window.setTimeout(start, startDelay);

    // タブの可視性変化で自動停止/再開
    const onVis = () => {
      if (document.hidden) {
        if (iv) {
          clearInterval(iv);
          iv = undefined;
        }
      } else {
        start();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    onCleanup(() => {
      document.removeEventListener('visibilitychange', onVis);
      if (startTimer) clearTimeout(startTimer);
      if (iv) clearInterval(iv);
      if (rafId) cancelAnimationFrame(rafId);
    });
  });

  // マウント解除時に止める
  onCleanup(() => {
    if (startTimer) clearTimeout(startTimer);
    if (iv) clearInterval(iv);
    if (rafId) cancelAnimationFrame(rafId);
  });

  return (
    <div
      style={{
        position: 'relative',
        width: `${props.width}px`,
        height: `${props.height}px`,
        background: '#00000017',
        border: `1px solid ${vars.color.border}`,
      }}
    >
      <canvas
        ref={(el) => (canvas = el)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          // 拡大時にもドットがにじまないように
          'image-rendering': 'pixelated',
          // 必要なら表示を大きくする
          width: `${props.width}px`,
          height: `${props.height}px`,
        }}
      />
      {/* <p style={{ position: 'absolute', top: '0px', left: '4px' }}>{maxValue()}</p> */}
      <p style={{ position: 'absolute', bottom: '0px', left: '4px' }}>{0}</p>
      <p style={{ position: 'absolute', top: '0px', right: '4px' }}>
        {lastBuffer()} {props.suffix}
      </p>
    </div>
  );
};
