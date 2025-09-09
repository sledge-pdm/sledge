import type { LabelMode } from '@sledge/core';
import { Show, type Component } from 'solid-js';
import { toggleInput, toggleThumb, toggleTrack, toggleWrapper } from '../../styles/control/toggle_switch.css';

interface Props {
  id?: string;
  name?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  labelMode?: LabelMode;
  /** 任意でラベル等を配置する場合の slot */
  children?: any;
}

const ToggleSwitch: Component<Props> = (p) => {
  p.labelMode = p.labelMode || 'left'; // デフォルトは左側にラベルを表示

  return (
    /* label 全体でクリック可能に */
    <label class={toggleWrapper}>
      <Show when={p.labelMode === 'left'}>{p.children}</Show>
      <input id={p.id} type='checkbox' name={p.name} checked={p.checked} onInput={(e) => p.onChange?.(e.currentTarget.checked)} class={toggleInput} />
      <span class={toggleTrack}>
        <span class={toggleThumb} />
      </span>
      <Show when={p.labelMode === 'right'}>{p.children}</Show>
    </label>
  );
};

export default ToggleSwitch;
