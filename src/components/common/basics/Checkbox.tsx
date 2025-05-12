import { Component } from 'solid-js';
import { checkboxWrapper, customCheckbox, hiddenCheckbox } from '~/styles/components/basics/checkbox.css';

const Checkbox: Component<{
  id?: string;
  name?: string;
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  inputRef?: (el: HTMLInputElement) => void;
}> = (props) => {
  return (
    <label class={checkboxWrapper}>
      <input
        id={props.id}
        class={hiddenCheckbox}
        name={props.name}
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
