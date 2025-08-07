// src/components/common/Dialog.tsx
import { accentedButton, getTheme } from '@sledge/theme';
import { body, footer, footerLeft, footerRight, header, overlay, wrapper } from '@styles/dialogs/dialog.css';
import { For, JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { globalConfig } from '~/stores/GlobalStores';

export interface DialogExternalProps {
  open: boolean;
  onClose: () => void;
}

interface DialogInternalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;

  closeByOutsideClick?: boolean;

  leftButtons: DialogButton[];
  rightButtons: DialogButton[];
}

interface DialogButton {
  text: string;
  accented?: boolean;
  onClick?: () => void;
}

export function Dialog(props: DialogInternalProps) {
  if (!props.open) return null;

  const showButton = () => props.leftButtons?.length > 0 || props.rightButtons?.length > 0;

  return (
    <Portal>
      <div class={getTheme(globalConfig.appearance.theme)}>
        <div
          class={overlay}
          onClick={(e) => {
            if (props.closeByOutsideClick) props.onClose();
            else {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        />
        <div class={wrapper} onClick={(e) => e.stopPropagation()}>
          {props.title && <div class={header}>{props.title.toUpperCase()}</div>}
          <div class={body}>
            {props.children}
            <Show when={showButton()}>
              <div class={footer}>
                <div class={footerLeft}>
                  <For each={props.leftButtons}>
                    {(item, i) => {
                      return (
                        <button class={item.accented ? accentedButton : undefined} onClick={item.onClick}>
                          {item.text}
                        </button>
                      );
                    }}
                  </For>
                </div>
                <div class={footerRight}>
                  <For each={props.rightButtons}>
                    {(item, i) => {
                      return (
                        <button class={item.accented ? accentedButton : undefined} onClick={item.onClick}>
                          {item.text}
                        </button>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  );
}
