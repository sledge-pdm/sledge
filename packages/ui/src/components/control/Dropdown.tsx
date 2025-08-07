import { vars } from '@sledge/theme';
import { For, type JSX, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { dropdownContainer, itemText, menuDirection, menuItem, menuStyle, triggerButton, triggerButtonNoBG } from '../../styles/control/dropdown.css';
import Icon from '../Icon';

export type DropdownOption<T extends string | number> = {
  label: string;
  value: T;
};

interface Props<T extends string | number = string> {
  value: T | (() => T);
  onChange?: (value: T) => void;
  options: DropdownOption<T>[];
  props?: JSX.HTMLAttributes<HTMLDivElement>;
  noBackground?: boolean;
  wheelSpin?: boolean;
}

const Dropdown = <T extends string | number>(p: Props<T>) => {
  let containerRef: HTMLDivElement | undefined;
  let menuRef: HTMLUListElement | undefined;

  const [open, setOpen] = createSignal(false);
  const [dir, setDir] = createSignal<'down' | 'up'>('down');

  const getValue = () => (typeof p.value === 'function' ? (p.value as () => T)() : p.value);
  const selectedLabel = createMemo(() => {
    const opt = p.options.find((o) => o.value === (typeof p.value === 'function' ? p.value() : p.value));
    return opt?.label ?? '';
  });

  const getLongestLabel = () => Math.max(...p.options.map((o) => o.label.length));
  const getAdjustedLabel = (label?: string) => label?.padEnd(getLongestLabel());

  const toggle = () => {
    setOpen(!open());
    if (open()) decideDirection();
  };
  const select = (option: DropdownOption<T>) => {
    p.onChange?.(option.value);
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

  // メニューを開く直前に上下どちらに出すか判定
  const decideDirection = () => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    // menuRef がまだ無い＝初回は最大高さ(200)で概算
    const menuH = menuRef ? Math.min(menuRef.scrollHeight, 200) : 200;
    setDir(spaceBelow < menuH && spaceAbove > spaceBelow ? 'up' : 'down');
  };

  const spin = (isUp: boolean) => {
    const currentIndex = p.options.findIndex((option) => option.value === getValue());
    const nextIndex = isUp ? (currentIndex + 1) % p.options.length : (currentIndex - 1 + p.options.length) % p.options.length;
    const next = p.options[nextIndex].value as T;

    p.onChange?.(next);
  };

  return (
    <div
      class={dropdownContainer}
      ref={containerRef}
      {...p.props}
      onWheel={(e) => {
        if (p.wheelSpin === undefined || p.wheelSpin) spin(e.deltaY > 0);
      }}
    >
      <button
        type='button'
        class={p.noBackground ? triggerButtonNoBG : triggerButton}
        onClick={toggle}
        aria-haspopup='listbox'
        aria-expanded={open()}
      >
        <p class={itemText}>{getAdjustedLabel(selectedLabel())}</p>
        <Icon src={'/icons/misc/dropdown_caret.png'} base={9} color={vars.color.onBackground} />
      </button>
      <Show when={open()}>
        <ul ref={menuRef} class={`${menuStyle} ${menuDirection[dir()]}`} role='listbox'>
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
