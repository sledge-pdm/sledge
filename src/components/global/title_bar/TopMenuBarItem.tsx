import { css } from '@acab/ecsstatic';
import { MenuList, MenuListOption } from '@sledge-pdm/ui';
import { Component, createEffect, createSignal, JSX, Show } from 'solid-js';

const menuItem = css`
  display: flex;
  flex-direction: row;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 26px;
`;

const menuItemText = css`
  font-family: ZFB11;
  font-size: 8px;
  text-rendering: geometricPrecision;
  margin: 0;
  align-content: center;
  text-align: center;
  width: 100%;
  height: 30px;
  padding-left: 6px;
  padding-right: 6px;
`;

const menuItemBackground = css`
  display: flex;
  flex-direction: row;
  position: absolute;
  align-items: center;
  left: 0;
  right: 0;
  height: 26px;
  z-index: -1;
`;

export interface TopMenuBarItemProps {
  label: string;
  labelStyleOverride?: JSX.CSSProperties;
  menuStyleOverride?: JSX.CSSProperties;
  title?: string;
  action: ((e: MouseEvent) => void) | ((e: MouseEvent) => Promise<void>);
  menu?: () => MenuListOption[];
  disabled?: boolean;
}

export const TopMenuBarItem: Component<TopMenuBarItemProps> = (props) => {
  const [menuOpen, setMenuOpen] = createSignal(false);

  // 排他中に開きっぱなしのメニューが残ると、そこから操作できてしまう
  createEffect(() => {
    if (props.disabled) setMenuOpen(false);
  });

  return (
    <div class={menuItem}>
      <a
        class={menuItemText}
        style={{
          ...(props.labelStyleOverride ?? {}),
          cursor: props.disabled ? 'auto' : 'pointer',
          'pointer-events': props.disabled ? 'none' : undefined,
          opacity: props.disabled ? 0.5 : undefined,
        }}
        onClick={async (e) => {
          if (props.disabled) return;
          await props.action(e);
          if (props.menu) setMenuOpen(true);
        }}
        title={props.title}
      >
        {props.label}
      </a>
      <div class={menuItemBackground} />
      <Show when={props.menu?.() && menuOpen() && !props.disabled}>
        <MenuList
          options={props.menu?.()!}
          onClose={() => setMenuOpen(false)}
          style={{
            ...(props.menuStyleOverride ?? {}),
            'margin-top': '4px',
          }}
        />
      </Show>
    </div>
  );
};
