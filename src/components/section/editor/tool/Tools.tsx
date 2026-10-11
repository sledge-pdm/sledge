import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge-pdm/core';
import { Component, For, Show } from 'solid-js';
import ToolPresetManager from '~/components/section/editor/tool/ToolPresetManager';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import ToolItem from './ToolItem';

const toolsList = css`
  margin-top: 8px;
  padding: 0 4px;
  display: flex;
  flex-direction: row;
  gap: 6px;
`;

const toolsSectionContent = css`
  padding-left: 0px;
  padding-right: 0px;
`;

const mainTools: ToolCategoryId[] = ['pen', 'eraser', 'fill', 'rectSelection', 'lassoSelection', 'autoSelection', 'move'];

const Tools: Component = () => {
  return (
    <SectionItem title='tool.'>
      <div class={toolsList}>
        <For each={mainTools}>
          {(categoryId) => {
            const isInUse = () => categoryId === toolStore.activeToolCategory;
            return <ToolItem categoryId={categoryId} isInUse={isInUse()} />;
          }}
        </For>
      </div>
      <div class={clsx(sectionContent, toolsSectionContent)}>
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
