import { css } from '@acab/ecsstatic';
import { Component, createEffect, createMemo, createSignal } from 'solid-js';

interface CanvasSize {
  width: number;
  height: number;
}

interface Props {
  value: CanvasSize;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  applyLabel?: string;
  onApply: (size: CanvasSize) => void;
}

const canvasSizeFormStyle = css`
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
`;

const canvasSizeTimesStyle = css`
  font-size: var(--text-xl);
  margin-bottom: var(--spacing-xs);
`;

const canvasSizeLabelStyle = css`
  font-family: ZFB03;
  font-size: var(--text-sm);
  color: var(--color-muted);
  margin-bottom: 1px;
  margin-left: 3px;
`;

const canvasSizeInputStyle = css`
  font-size: var(--text-xl);
  width: 64px;
`;

const canvasSizeButtonStyle = css`
  margin: var(--spacing-xs) 0;
  margin-left: auto;
`;

const CanvasSizeInput: Component<Props> = (props) => {
  const [width, setWidth] = createSignal(props.value.width);
  const [height, setHeight] = createSignal(props.value.height);

  createEffect(() => {
    setWidth(props.value.width);
    setHeight(props.value.height);
  });

  const widthNum = () => Number(width());
  const heightNum = () => Number(height());

  const withinBounds = () => {
    const w = widthNum();
    const h = heightNum();
    if (Number.isNaN(w) || Number.isNaN(h)) return false;
    if (props.minWidth !== undefined && w < props.minWidth) return false;
    if (props.maxWidth !== undefined && w > props.maxWidth) return false;
    if (props.minHeight !== undefined && h < props.minHeight) return false;
    if (props.maxHeight !== undefined && h > props.maxHeight) return false;
    return true;
  };

  const isDirty = createMemo(() => withinBounds() && (widthNum() !== props.value.width || heightNum() !== props.value.height));

  const apply = () => {
    if (!withinBounds()) return;
    props.onApply({ width: widthNum(), height: heightNum() });
  };

  return (
    <div class={canvasSizeFormStyle}>
      <div>
        <p class={canvasSizeLabelStyle}>width</p>
        <input
          class={canvasSizeInputStyle}
          type='number'
          name='width'
          value={width()}
          min={props.minWidth}
          max={props.maxWidth}
          onInput={(e) => setWidth((e.currentTarget as HTMLInputElement).valueAsNumber || Number((e.currentTarget as HTMLInputElement).value))}
          required
        />
      </div>

      <p class={canvasSizeTimesStyle}>x</p>

      <div>
        <p class={canvasSizeLabelStyle}>height</p>
        <input
          class={canvasSizeInputStyle}
          type='number'
          name='height'
          value={height()}
          min={props.minHeight}
          max={props.maxHeight}
          onInput={(e) => setHeight((e.currentTarget as HTMLInputElement).valueAsNumber || Number((e.currentTarget as HTMLInputElement).value))}
          required
        />
      </div>
      <button
        class={canvasSizeButtonStyle}
        onClick={(e) => {
          e.preventDefault();
          apply();
        }}
        disabled={!isDirty()}
        style={{
          color: isDirty() ? 'var(--color-active)' : undefined,
          'border-color': isDirty() ? 'var(--color-active)' : undefined,
        }}
      >
        {props.applyLabel ?? 'apply'}
      </button>
    </div>
  );
};

export default CanvasSizeInput;
