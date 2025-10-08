import { css } from '@acab/ecsstatic';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createSignal, For, JSX, Show } from 'solid-js';
import { sectionCaption } from '~/components/section/SectionStyles';

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--color-surface);
  padding: 2px 4px;
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
  background-color: vars(--color-border-secondary);
`;
const iconContainer = css`
  display: flex;
  flex-direction: row;
  margin-left: 12px;
  gap: 12px;
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
        <div class={iconContainer}>
          <For each={props.icons}>
            {(item) => {
              const disabled = item.disabled ?? false;
              return (
                <div
                  style={{ cursor: disabled ? 'none' : 'pointer', 'pointer-events': disabled ? 'none' : 'all' }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Icon
                    src={item.src}
                    base={12}
                    scale={1}
                    color={disabled ? vars.color.muted : vars.color.onBackground}
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
