import { css } from '@acab/ecsstatic';
import { Component, createEffect, createMemo, createSignal } from 'solid-js';

interface Props {
  value: number;
  min: number;
  max: number;
  applyLabel?: string;
  onApply: (value: number) => void;
}

const inputContainerStyle = css`
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
`;

const inputStyle = css`
  font-size: var(--text-xl);
  width: 64px;
`;

const applyButtonStyle = css`
  margin: var(--spacing-xs) 0;
`;

const ConfigNumberInput: Component<Props> = (props) => {
  const [currentValue, setCurrentValue] = createSignal(props.value);

  createEffect(() => {
    setCurrentValue(props.value);
  });

  const parsedValue = createMemo(() => Number(currentValue()));
  const isWithinBounds = createMemo(() => {
    const value = parsedValue();
    return Number.isInteger(value) && value >= props.min && value <= props.max;
  });
  const isDirty = createMemo(() => isWithinBounds() && parsedValue() !== props.value);

  const apply = () => {
    if (!isWithinBounds()) return;
    props.onApply(parsedValue());
  };

  return (
    <div class={inputContainerStyle}>
      <input
        class={inputStyle}
        type='number'
        value={currentValue()}
        min={props.min}
        max={props.max}
        step={1}
        onInput={(e) => {
          const raw = (e.currentTarget as HTMLInputElement).valueAsNumber;
          setCurrentValue(Number.isNaN(raw) ? Number((e.currentTarget as HTMLInputElement).value) : raw);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply();
          }
        }}
        required
      />
      <button
        class={applyButtonStyle}
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

export default ConfigNumberInput;
