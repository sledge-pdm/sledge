import type { LabelMode } from '@sledge/core';
import { type Component, Show } from 'solid-js';
import { checkboxWrapper, customCheckbox, hiddenCheckbox } from '../../styles/control/checkbox.css';

const Checkbox: Component<{
  id?: string;
  name?: string;
  label?: string;
  labelMode?: LabelMode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  inputRef?: (el: HTMLInputElement) => void;
}> = (props) => {
  const labelMode = props.labelMode ?? 'right';
  return (
    <label class={checkboxWrapper}>
      <Show when={labelMode === 'left'}>{props.label}</Show>
      <input
        id={props.id}
        class={hiddenCheckbox}
        name={props.name}
        type='checkbox'
        checked={props.checked}
        onChange={(e) => props.onChange?.(e.currentTarget.checked)}
        ref={props.inputRef}
      />
      <span
        class={customCheckbox}
        style={{
          'margin-right': labelMode === 'right' ? '8px' : 0,
          'margin-left': labelMode === 'left' ? '8px' : 0,
        }}
      ></span>
      <Show when={labelMode === 'right'}>{props.label}</Show>
    </label>
  );
};

export default Checkbox;
