import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, Show } from 'solid-js';
import { setActiveToolCategory } from '~/features/tools/ToolController';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';

const toolConfigRow = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 32px;
  width: auto;
  gap: var(--spacing-md);
  align-items: center;
`;

const toolConfigRowClickable = css`
  display: flex;
  flex-direction: row;
  gap: var(--spacing-md);
  align-items: center;
  pointer-events: all;
  cursor: pointer;
`;

const toolConfigRowName = css`
  cursor: pointer;
  width: 40px;
  font-size: var(--text-sm);
  padding: var(--spacing-md) 0;
`;

const iconWrapper = css`
  padding: 1px;
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
    <div class={toolConfigRow}>
      {/* <Light on={props.isInUse} /> */}
      <div class={toolConfigRowClickable} onClick={() => setActiveToolCategory(category.id)}>
        <div class={iconWrapper}>
          <Icon src={category.iconSrc ?? ''} base={8} scale={2} color={props.isInUse ? color.active : color.onBackground} />
        </div>
        <Show when={shouldShowLabel()}>
          <p
            class={toolConfigRowName}
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
