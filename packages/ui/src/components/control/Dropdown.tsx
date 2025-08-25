import { vars, ZFB08 } from '@sledge/theme';
import { createEffect, createMemo, createSignal, For, type JSX, onCleanup, onMount, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
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
  fullWidth?: boolean;
  align?: 'left' | 'right';
  props?: JSX.HTMLAttributes<HTMLDivElement>;
  noBackground?: boolean;
  wheelSpin?: boolean;
  disabled?: boolean;
  fontFamily?: string;
}

const Dropdown = <T extends string | number>(p: Props<T>) => {
  p.align = p.align ?? 'left';

  let containerRef: HTMLDivElement | undefined;
  let menuRef: HTMLUListElement | undefined;

  const [open, setOpen] = createSignal(false);
  const [dir, setDir] = createSignal<'down' | 'up'>('down');
  type Coords = { x: number; y: number };
  const [coords, setCoords] = createSignal<Coords>({ x: 0, y: 0 });

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

  // 画面外にはみ出さないように位置を調整
  const clampToViewport = (x: number, y: number, w: number, h: number, margin = 4) => {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let nx = x;
    let ny = y;
    if (nx + w > vw - margin) nx = Math.max(margin, vw - w - margin);
    if (ny + h > vh - margin) ny = Math.max(margin, vh - h - margin);
    if (nx < margin) nx = margin;
    if (ny < margin) ny = margin;
    return { x: nx, y: ny };
  };

  // Portal 先で表示するため、viewport 基準の固定座標を算出
  const adjustPosition = () => {
    if (!containerRef || !menuRef) return;
    const trigger = containerRef.getBoundingClientRect();
    const menuRect = menuRef.getBoundingClientRect();
    const w = menuRect.width || 160; // fallback
    const h = Math.min(menuRef.scrollHeight, 200) || 160;

    // 横位置
    let x = p.align === 'left' ? trigger.left : trigger.right - w;
    // 縦位置（dir に応じる）
    let y = dir() === 'down' ? trigger.bottom : trigger.top - h;

    const clamped = clampToViewport(x, y, w, h);
    setCoords(clamped);
  };

  onMount(() => {
    const onResize = () => open() && adjustPosition();
    const onScroll = () => open() && adjustPosition();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onCleanup(() => {
      window.removeEventListener('resize', onResize as any);
      window.removeEventListener('scroll', onScroll as any);
    });
  });

  // open 変更時や dir 判定後に位置を更新
  createEffect(() => {
    if (open()) {
      queueMicrotask(() => {
        decideDirection();
        adjustPosition();
      });
    }
  });

  const noItem = createMemo<boolean>(() => p.options.length === 0);

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
        if (noItem() || p.disabled) return;
        if (p.wheelSpin === undefined || p.wheelSpin) spin(e.deltaY > 0);
      }}
    >
      <button
        type='button'
        class={p.noBackground ? triggerButtonNoBG : triggerButton}
        style={{
          'box-sizing': 'border-box',
          overflow: 'hidden',
          opacity: p.disabled || noItem() ? 0.5 : 1,
          cursor: p.disabled || noItem() ? 'not-allowed' : 'pointer',
          'pointer-events': p.disabled || noItem() ? 'none' : 'all',
          width: p.fullWidth ? '100%' : undefined,
        }}
        onClick={toggle}
        aria-haspopup='listbox'
        aria-expanded={open()}
      >
        <p class={itemText} style={{ 'font-family': p.fontFamily ?? ZFB08, width: p.fullWidth ? '100%' : undefined }}>
          {noItem() ? '- no item -' : getAdjustedLabel(selectedLabel())}
        </p>
        <div>
          <Icon src={'/icons/misc/dropdown_caret.png'} base={9} color={vars.color.onBackground} style={{ opacity: 0.75 }} />
        </div>
      </button>
      <Show when={open()}>
        <Portal>
          <ul
            ref={menuRef}
            class={`${menuStyle} ${menuDirection[dir()]}`}
            role='listbox'
            style={{
              position: 'fixed',
              top: `${coords().y}px`,
              left: `${coords().x}px`,
              bottom: 'auto',
              right: 'auto',
            }}
            onTransitionEnd={adjustPosition}
          >
            <For each={p.options}>
              {(option) => (
                <li class={menuItem} role='option' aria-selected={option.value === getValue()} onClick={() => select(option)}>
                  <p class={itemText} style={{ 'font-family': p.fontFamily ?? ZFB08 }}>
                    {getAdjustedLabel(option.label)}
                  </p>
                </li>
              )}
            </For>
          </ul>
        </Portal>
      </Show>
    </div>
  );
};

export default Dropdown;
