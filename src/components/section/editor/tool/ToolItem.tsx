import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge-pdm/core';
import { color, Icon } from '@sledge-pdm/ui';
import { Component, Show } from 'solid-js';
import { setActiveToolCategory } from '~/features/tools/ToolController';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';

const itemRoot = css`
  display: flex;
  flex-direction: row;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  pointer-events: all;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: var(--color-button-hover);
  }
`;

const itemRootInUse = css`
  flex: 1;
  background-color: var(--color-surface);
  padding: 0 8px;
`;

const icon = css`
  min-width: 16px;
  min-height: 16px;
`;

const name = css`
  /*width: 40px;*/
  margin-left: 6px;
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-active);
`;

interface Props {
  categoryId: ToolCategoryId;
  isInUse: boolean;
}

const ToolItem: Component<Props> = (props: Props) => {
  const category = toolStore.tools[props.categoryId];

  return (
    <div class={clsx(itemRoot, props.isInUse ? itemRootInUse : undefined)} onClick={() => setActiveToolCategory(category.id)}>
      <Icon
        class={icon}
        src={category.iconSrc ?? ''}
        base={8}
        scale={2}
        color={props.isInUse ? color.active : color.onBackground}
        hoverColor={color.active}
      />

      <Show when={props.isInUse}>
        <p class={name}>{category.name}.</p>
      </Show>
    </div>
  );
};

export default ToolItem;
