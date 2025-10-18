import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { spacing } from '@sledge/theme';
import { Component, For, Show } from 'solid-js';
import ToolPresetManager from '~/components/section/editor/tool/ToolPresetManager';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { flexRow } from '~/styles/styles';
import ToolItem from './ToolItem';

const toolsSectionContent = css`
  padding-left: 4px;
`;

const mainTools: ToolCategoryId[] = ['pen', 'eraser', 'fill', 'rectSelection', 'autoSelection', 'lassoSelection', 'move'];

const Tools: Component = () => {
  return (
    <SectionItem title='tool.'>
      <div class={clsx(sectionContent, toolsSectionContent)}>
        <div class={flexRow} style={{ 'margin-bottom': spacing.xs, gap: '16px' }}>
          <For each={mainTools}>
            {(categoryId) => {
              const isInUse = () => categoryId === toolStore.activeToolCategory;
              return <ToolItem categoryId={categoryId} withLabel='inUse' isInUse={isInUse()} />;
            }}
          </For>
        </div>

        <Show when={mainTools.includes(toolStore.activeToolCategory)}>
          <div>
            <ToolPresetManager toolId={toolStore.tools[toolStore.activeToolCategory].id} />
          </div>
        </Show>
      </div>
    </SectionItem>
  );
};

export default Tools;
