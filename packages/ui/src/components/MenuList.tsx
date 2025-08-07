import { vars } from '@sledge/theme';
import { itemText, menuDirection, menuItem, menuStyle } from '../styles/menu_list.css';
import { type Component, For, type JSX, onCleanup, onMount } from 'solid-js';

export interface MenuListOption {
  label: string;
  disabled?: boolean;
  color?: string;
  onSelect: () => void;
}

interface Props extends Omit<JSX.HTMLAttributes<HTMLUListElement>, 'onClick'> {
  options: MenuListOption[];
  align?: 'left' | 'right'; // メニューの配置
  menuDir?: 'down' | 'up';
  closeByOutsideClick?: boolean; // メニュー外クリックで閉じるかどうか
  onClose?: () => void; // メニューが閉じるときのコールバック
}

const MenuList: Component<Props> = (props) => {
  let containerRef: HTMLUListElement | undefined;
  const dir = props.menuDir ?? 'down';

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      props.onClose?.();
    }
  };

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  return (
    <ul
      {...props}
      ref={containerRef}
      class={`${menuStyle} ${menuDirection[dir]}`}
      role='listbox'
      style={{
        ...(typeof props.style === 'object' ? props.style : {}),
        left: props.align === 'right' ? 'auto' : '0px',
        right: props.align === 'right' ? '0px' : 'auto',
      }}
    >
      <For each={props.options} fallback={<li>選択肢がありません</li>}>
        {(option) => (
          <li
            class={menuItem}
            role='option'
            style={{
              'pointer-events': option.disabled ? 'none' : 'all',
              opacity: option.disabled ? 0.5 : 1,
            }}
            onClick={() => {
              option.onSelect?.();
              props.onClose?.();
            }}
          >
            <p class={itemText} style={{ color: option.color ?? vars.color.onBackground }}>
              {option.label}
            </p>
          </li>
        )}
      </For>
    </ul>
  );
};

export default MenuList;
