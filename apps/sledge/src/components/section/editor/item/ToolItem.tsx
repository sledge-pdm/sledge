import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component } from 'solid-js';
import { setActiveToolCategory } from '~/controllers/tool/ToolController';
import { toolStore } from '~/stores/EditorStores';
import { toolConfigRow, toolConfigRowClickable } from '~/styles/section/editor/tools.css';
import { ToolCategoryId } from '~/tools/Tools';

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
    <div class={toolConfigRow} style={{}}>
      {/* <Light on={props.isInUse} /> */}
      <div class={toolConfigRowClickable} onClick={() => setActiveToolCategory(category.id)}>
        <Icon src={category.iconSrc ?? ''} base={10} scale={2} color={props.isInUse ? vars.color.active : vars.color.onBackground} />
        {/* <Show when={shouldShowLabel()}>
          <p
            class={toolConfigRowName}
            style={{
              color: props.isInUse ? vars.color.active : vars.color.onBackground,
            }}
          >
            {category.name}.
          </p>
        </Show> */}
      </div>
    </div>
  );
};

export default ToolItem;
