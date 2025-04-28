import { For, JSX } from 'solid-js';
import { dropdownRoot } from '~/styles/components/basics/dropdown.css';

export type DropdownOption<T extends string | number> = {
  label: string;
  value: T;
};

interface Props<T extends string | number = string> {
  value: T | (() => T);
  selected: T | (() => T);
  /** 選択候補 */
  options: DropdownOption<T>[];
  /** 値変更時に呼び出される */
  onChange?: (value: T) => void;
  /** aria-label など任意で渡す */
  props?: JSX.SelectHTMLAttributes<HTMLSelectElement>;
}

const Dropdown = <T extends string | number>(p: Props<T>) => {
  const getValue = () => (typeof p.value === 'function' ? (p.value as () => T)() : p.value);

  return (
    <select
      {...p.props}
      class={dropdownRoot}
      value={String(getValue())}
      onChange={(e) => p.onChange?.(e.currentTarget.value as unknown as T)}
    >
      <For each={p.options}>
        {(o) => (
          <option selected={p.selected === o.value} value={String(o.value)}>
            {o.label}
          </option>
        )}
      </For>
    </select>
  );
};

export default Dropdown;
