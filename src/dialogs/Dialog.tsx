// src/components/common/Dialog.tsx
import * as styles from '@styles/dialogs/dialog.css';
import { For, JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { accentedButton } from '~/styles/global.css';

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
      <div
        class={styles.overlay}
        onClick={(e) => {
          if (props.closeByOutsideClick) props.onClose();
          else {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      />
      <div class={styles.wrapper} onClick={(e) => e.stopPropagation()}>
        {props.title && <div class={styles.header}>{props.title.toUpperCase()}</div>}
        <div class={styles.body}>
          {props.children}
          <Show when={showButton()}>
            <div class={styles.footer}>
              <div class={styles.footerLeft}>
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
              <div class={styles.footerRight}>
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
    </Portal>
  );
}
