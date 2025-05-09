import { For, JSX, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { dropdownContainer, menuItem, menuStyle, triggerButton } from '~/styles/components/basics/dropdown.css';

export type DropdownOption<T extends string | number> = {
  label: string;
  value: T;
};

interface Props<T extends string | number = string> {
  /** 選択中の値 */
  value: T | (() => T);
  /** 値変更時ハンドラ */
  onChange?: (value: T) => void;
  /** 選択肢 */
  options: DropdownOption<T>[];
  /** aria-label など追加属性 */
  props?: JSX.HTMLAttributes<HTMLDivElement>;
}

const Dropdown = <T extends string | number>(p: Props<T>) => {
  const [open, setOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const getValue = () => (typeof p.value === 'function' ? (p.value as () => T)() : p.value);
  const selectedLabel = () => {
    const opt = p.options.find((o) => o.value === getValue());
    return opt ? opt.label : '';
  };

  const toggle = () => setOpen(!open());
  const select = (value: T) => {
    p.onChange?.(value);
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
        <p>{selectedLabel()}</p>
        <img src={'/icons/misc/dropdown_caret.png'} width={9} height={9}></img>
      </button>
      <Show when={open()}>
        <ul class={menuStyle} role='listbox'>
          <For each={p.options} fallback={<li>選択肢がありません</li>}>
            {(option) => (
              <li
                class={menuItem}
                role='option'
                aria-selected={option.value === getValue()}
                onClick={() => select(option.value)}
              >
                <p>{option.label}</p>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};

export default Dropdown;
