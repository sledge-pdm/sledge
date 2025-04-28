import { Component } from 'solid-js';
import { customRadio, hiddenRadio, radioWrapper } from '~/styles/components/radio_button.css';

const RadioButton: Component<{ label?: string; name: string }> = (props) => {
  return (
    <label class={radioWrapper}>
      {props.label}
      <input class={hiddenRadio} type='radio' name={props.name} />
      <span class={customRadio}></span>
    </label>
  );
};

export default RadioButton;
