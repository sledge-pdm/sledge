import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createSignal, For, JSX, Show } from 'solid-js';
import { sectionCaption } from '~/components/section/SectionStyles';

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--color-surface);
  padding: 0px 8px;
  height: 14px;
`;

const captionContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const border = css`
  height: 1px;
  flex-grow: 1;
  width: 100%;
  margin-left: 8px;
`;

const iconsContainer = css`
  display: flex;
  flex-direction: row;
  margin-left: 12px;
  gap: 6px;
`;

const iconWrapper = css`
  display: flex;
  flex-direction: row;
  height: 12px;
  width: 12px;
  align-items: center;
  justify-content: center;
`;

export interface SubHeaderIcon {
  src: string;
  onClick: (e: MouseEvent) => void;
  disabled?: boolean;
}

interface Props {
  // title?: string;
  icons?: SubHeaderIcon[];
  defaultExpanded?: boolean;
  onExpandChanged?: (expanded: boolean) => void;
  children: JSX.Element;
}
export const SectionSubHeader: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? true);

  return (
    <div class={container} style={{ 'margin-bottom': expanded() ? '8px' : '0px' }}>
      <div class={captionContainer}>
        <p class={sectionCaption}>{props.children}</p>
      </div>
      <div class={border} />
      <Show when={expanded()}>
        <div class={iconsContainer}>
          <For each={props.icons}>
            {(item) => {
              const disabled = item.disabled ?? false;
              return (
                <div
                  class={iconWrapper}
                  style={{ cursor: disabled ? 'none' : 'pointer', 'pointer-events': disabled ? 'none' : 'all' }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Icon
                    src={item.src}
                    base={8}
                    color={disabled ? color.muted : color.onBackground}
                    hoverColor={color.active}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      item.onClick(e);
                    }}
                  />
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
