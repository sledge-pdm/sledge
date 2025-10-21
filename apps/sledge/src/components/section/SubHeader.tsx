import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createSignal, For, JSX, Show } from 'solid-js';
import { sectionCaption } from '~/components/section/SectionStyles';

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--color-surface);
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: 8px;
  padding-right: 4px;
  width: 100%;
  height: 14px;
`;

const expandableContainer = css`
  &:hover > p {
    color: var(--color-enabled);
  }
`;

const captionContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
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
  expandable?: boolean;
  defaultExpanded?: boolean;
  onExpandChanged?: (expanded: boolean) => void;
  children: JSX.Element;
}
export const SectionSubHeader: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? true);

  return (
    <div
      class={container}
      onClick={() => {
        if (props.expandable) {
          setExpanded(!expanded());
          props.onExpandChanged?.(expanded());
        }
      }}
    >
      <div
        class={clsx(container, props.expandable && expandableContainer)}
        style={{
          cursor: props.expandable ? 'pointer' : 'auto',
        }}
      >
        <p class={sectionCaption}>{props.children}</p>

        <Show when={expanded() && props.icons}>
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
        <Show when={props.expandable}>
          <div style={{ 'padding-bottom': '1px' }}>
            <Icon src={'/icons/misc/triangle_5.png'} base={5} transform={expanded() ? undefined : 'scaleY(-1)'} />
          </div>
        </Show>
      </div>
    </div>
  );
};
