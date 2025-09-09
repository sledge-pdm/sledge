import { type Component } from 'solid-js';
import { customRadio, hiddenRadio, radioWrapper } from '../../styles/control/radio_button.css';

const RadioButton: Component<{
  id?: string;
  name?: string;
  label?: string;
  value?: boolean;
  onChange?: (checked: boolean) => void;
}> = (props) => {
  return (
    <label class={radioWrapper}>
      {props.label}
      <input
        id={props.id}
        class={hiddenRadio}
        type='radio'
        name={props.name}
        checked={props.value}
        onChange={(e) => {
          if (props.onChange) props.onChange(e.target.checked);
        }}
      />
      <span class={customRadio}></span>
    </label>
  );
};

export default RadioButton;
