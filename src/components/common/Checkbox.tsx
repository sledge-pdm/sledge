import { Component } from 'solid-js';
import {
  checkboxWrapper,
  customCheckbox,
  hiddenCheckbox,
} from '~/styles/components/checkbox.css';

const Checkbox: Component<{ label?: string }> = (props) => {
  return (
    <label class={checkboxWrapper}>
      {props.label}
      <input class={hiddenCheckbox} type='checkbox' />
      <span class={customCheckbox}></span>
    </label>
  );
};

export default Checkbox;
