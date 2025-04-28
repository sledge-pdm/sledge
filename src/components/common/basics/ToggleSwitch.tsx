import { Component } from 'solid-js';
import { toggleInput, toggleThumb, toggleTrack, toggleWrapper } from '~/styles/components/basics/toggle_switch.css';

interface Props {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** 任意でラベル等を配置する場合の slot */
  children?: any;
}

const ToggleSwitch: Component<Props> = (p) => (
  /* label 全体でクリック可能に */
  <label class={toggleWrapper}>
    {p.children}
    <input
      type='checkbox'
      checked={p.checked}
      onInput={(e) => p.onChange?.(e.currentTarget.checked)}
      class={toggleInput}
    />
    <span class={toggleTrack}>
      <span class={toggleThumb} />
    </span>
  </label>
);

export default ToggleSwitch;
