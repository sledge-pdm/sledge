import { toggleInput, toggleThumb, toggleTrack, toggleWrapper } from '@styles/control/toggle_switch.css';
import { type Component } from 'solid-js';

interface Props {
  id?: string;
  name?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** 任意でラベル等を配置する場合の slot */
  children?: any;
}

const ToggleSwitch: Component<Props> = (p) => (
  /* label 全体でクリック可能に */
  <label class={toggleWrapper}>
    {p.children}
    <input id={p.id} type='checkbox' name={p.name} checked={p.checked} onInput={(e) => p.onChange?.(e.currentTarget.checked)} class={toggleInput} />
    <span class={toggleTrack}>
      <span class={toggleThumb} />
    </span>
  </label>
);

export default ToggleSwitch;
