import { For, JSX, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { dropdownContainer, itemText, menuItem, menuStyle, triggerButton } from '~/styles/components/basics/dropdown.css';

export type DropdownOption<T extends string | number> = {
  label: string;
  value: T;
};

interface Props<T extends string | number = string> {
  value: T | (() => T);
  onChange?: (value: T) => void;
  options: DropdownOption<T>[];
  props?: JSX.HTMLAttributes<HTMLDivElement>;
}

const Dropdown = <T extends string | number>(p: Props<T>) => {
  let containerRef: HTMLDivElement | undefined;

  const [open, setOpen] = createSignal(false);
  const getValue = () => (typeof p.value === 'function' ? (p.value as () => T)() : p.value);
  const [selected, setSelected] = createSignal(p.options.find((o) => o.value === getValue())?.label);

  const getLongestLabel = () => Math.max(...p.options.map((o) => o.label.length));
  const getAdjustedLabel = (label?: string) => label?.padEnd(getLongestLabel());

  const toggle = () => setOpen(!open());
  const select = (option: DropdownOption<T>) => {
    p.onChange?.(option.value);
    setSelected(option.label);
    setOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  return (
    <div class={dropdownContainer} ref={containerRef} {...p.props}>
      <button type='button' class={triggerButton} onClick={toggle} aria-haspopup='listbox' aria-expanded={open()}>
        <p class={itemText}>{getAdjustedLabel(selected())}</p>
        <img src={'/icons/misc/dropdown_caret.png'} width={9} height={9}></img>
      </button>
      <Show when={open()}>
        <ul class={menuStyle} role='listbox'>
          <For each={p.options} fallback={<li>選択肢がありません</li>}>
            {(option) => (
              <li class={menuItem} role='option' aria-selected={option.value === getValue()} onClick={() => select(option)}>
                <p class={itemText}>{getAdjustedLabel(option.label)}</p>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};

export default Dropdown;
