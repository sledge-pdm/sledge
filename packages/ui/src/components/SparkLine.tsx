import { vars } from '@sledge/theme';
import { type Component, createEffect, createSignal, onMount } from 'solid-js';

interface SparkLineProps {
  height: number;
  length: number;
  lengthMult?: number;
  min?: number;
  values: (number | undefined)[]; // old->new (should be pad started to length)
  color?: string;
}

export const SparkLine: Component<SparkLineProps> = (props) => {
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let ctx: CanvasRenderingContext2D;
  const [values, setValues] = createSignal<(number | undefined)[]>(Array(props.length).fill(undefined));
  const lengthMult = () => props.lengthMult ?? 1;

  createEffect(() => {
    const newValues = props.values;
    const paddedValues = Array(props.length - newValues.length)
      .fill(undefined)
      .concat(newValues);
    setValues(paddedValues);
    updateLine();
  });

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    container.style.width = `${props.length * lengthMult()}px`;
    container.style.height = `${props.height}px`;
    canvas.style.width = `${props.length * lengthMult()}px`;
    canvas.style.height = `${props.height}px`;
    canvas.width = props.length * lengthMult();
    canvas.height = props.height;

    const newValues = props.values;
    const paddedValues = Array(props.length - newValues.length)
      .fill(undefined)
      .concat(newValues);
    setValues(paddedValues);
    updateLine();
  });

  // 現在のvaluesで描画を更新
  const updateLine = async () => {
    ctx = canvas.getContext('2d')!;

    const maxValue = values().reduce((a, b) => ((a ?? 0) > (b ?? 0) ? a : b), props.min ?? 0);

    // クリア
    ctx.clearRect(0, 0, props.length * lengthMult(), props.height);
    ctx.fillStyle = props.color || 'lime';

    // 20%
    const paddingTop = Math.round(props.height * 0.2);

    for (let x = 0; x < values().length; x++) {
      const v = values()[x];
      if (v === undefined) continue;
      if (!maxValue) continue;
      // 0〜maxValue を 0〜(height-1) に丸め込む
      const q = Math.round((v / maxValue) * (props.height - 1 - paddingTop));
      // 底辺を y=height-1 として上向きに描画
      const y = props.height - 1 - q;
      ctx.fillRect(x * lengthMult(), y, lengthMult(), 1);
    }
  };

  return (
    <div
      ref={(el) => (container = el)}
      style={{
        position: 'relative',
        background: '#00000017',
        border: `1px solid ${vars.color.border}`,
        width: `${props.length * lengthMult()}px`,
        height: `${props.height}px`,
        'box-sizing': 'content-box',
      }}
    >
      <canvas
        ref={(el) => (canvas = el)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          'image-rendering': 'pixelated',
          width: `${props.length * lengthMult()}px`,
          height: `${props.height}px`,
          'box-sizing': 'content-box',
        }}
      />
    </div>
  );
};
