import { Component, JSX } from 'solid-js';
import {
  checkboxWrapper,
  customCheckbox,
  hiddenCheckbox,
} from '~/styles/components/checkbox.css';

const Checkbox: Component<{
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  inputRef?: (el: HTMLInputElement) => void;
}> = (props) => {
  return (
    <label class={checkboxWrapper}>
      <input
        class={hiddenCheckbox}
        type='checkbox'
        checked={props.checked}
        onChange={(e) => props.onChange?.(e.currentTarget.checked)}
        ref={props.inputRef}
      />
      <span class={customCheckbox}></span>
      {props.label}
    </label>
  );
};

export default Checkbox;
