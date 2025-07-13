import { itemText, menuDirection, menuItem, menuStyle } from '@styles/menu_list.css';
import { type Component, For, onCleanup, onMount } from 'solid-js';

export interface MenuListOption {
  label: string;
  onSelect: () => void;
}

interface Props {
  options: MenuListOption[];
  dir?: 'down' | 'up';
  closeByOutsideClick?: boolean; // メニュー外クリックで閉じるかどうか
  onClose?: () => void; // メニューが閉じるときのコールバック
}

const MenuList: Component<Props> = (props) => {
  let containerRef: HTMLUListElement | undefined;
  const dir = props.dir ?? 'down';

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
    <ul ref={containerRef} class={`${menuStyle} ${menuDirection[dir]}`} role='listbox'>
      <For each={props.options} fallback={<li>選択肢がありません</li>}>
        {(option) => (
          <li
            class={menuItem}
            role='option'
            onClick={() => {
              option.onSelect?.();
            }}
          >
            <p class={itemText}>{option.label}</p>
          </li>
        )}
      </For>
    </ul>
  );
};

export default MenuList;
