import { css } from '@acab/ecsstatic';
import { Component, createEffect, createSignal, Show } from 'solid-js';
import { Consts } from '~/Consts';

const root = css`
  min-width: 40px;
  width: 40px;
  white-space: nowrap;
`;
const sizeInput = css`
  width: 100%;
  font-family: ZFB09;
  font-size: 16px;
  min-width: 0;
  padding: 0;
  letter-spacing: 1px;
`;

const ToolSizeInput: Component<{ value: number | undefined; onChange: (value: number) => void }> = (props) => {
  const [editing, setEditing] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (editing()) {
      inputRef?.focus();
      inputRef?.select();
    }
  });

  const apply = () => {
    if (!editing()) return;
    const value = inputRef?.valueAsNumber;
    setEditing(false);
    if (value !== undefined && Number.isFinite(value)) {
      props.onChange(Math.max(1, Math.min(Consts.maxPenSize, Math.round(value))));
    }
  };

  return (
    <div class={root}>
      <Show
        when={editing()}
        fallback={
          <p
            role='button'
            tabIndex={0}
            aria-label='Edit size'
            onDblClick={() => setEditing(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setEditing(true);
              }
            }}
          >
            {props.value} px
          </p>
        }
      >
        <input
          ref={inputRef}
          class={sizeInput}
          type='number'
          aria-label='Size'
          value={props.value}
          min={1}
          max={Consts.maxPenSize}
          step={1}
          onBlur={apply}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
        />
      </Show>
    </div>
  );
};

export default ToolSizeInput;
