import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, Show } from 'solid-js';
import { setActiveToolCategory } from '~/features/tools/ToolController';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';

const itemRoot = css`
  display: flex;
  flex-direction: row;
  height: 32px;
  gap: 8px;
  align-items: center;
`;

const clickableContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  pointer-events: all;
  cursor: pointer;
`;

const name = css`
  cursor: pointer;
  width: 40px;
  margin-left: 8px;
  font-size: var(--text-sm);
`;
interface Props {
  categoryId: ToolCategoryId;
  withLabel?: 'none' | 'always' | 'inUse';
  isInUse: boolean;
}

const ToolItem: Component<Props> = (props: Props) => {
  props.withLabel = props.withLabel ?? 'none';
  const category = toolStore.tools[props.categoryId];
  const shouldShowLabel = () => props.withLabel === 'always' || (props.withLabel === 'inUse' && props.isInUse);

  return (
    <div class={itemRoot}>
      {/* <Light on={props.isInUse} /> */}
      <div class={clickableContainer} onClick={() => setActiveToolCategory(category.id)}>
        <Icon src={category.iconSrc ?? ''} base={8} scale={2} color={props.isInUse ? color.active : color.onBackground} hoverColor={color.active} />

        <Show when={shouldShowLabel()}>
          <p
            class={name}
            style={{
              color: props.isInUse ? color.active : color.onBackground,
            }}
          >
            {category.name}.
          </p>
        </Show>
      </div>
    </div>
  );
};

export default ToolItem;
