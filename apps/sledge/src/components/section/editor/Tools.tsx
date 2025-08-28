import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, For, Show } from 'solid-js';
import SectionItem from '~/components/section/SectionItem';
import ToolPresetManager from '~/components/section/editor/tool/ToolPresetManager';
import { toolStore } from '~/stores/EditorStores';
import { sectionContent } from '~/styles/section/section_item.css';
import { ToolCategoryId } from '~/tools/Tools';
import ToolItem from './item/ToolItem';

const mainTools: ToolCategoryId[] = ['pen', 'eraser', 'fill', 'rectSelection', 'autoSelection', 'move'];

const Tools: Component = () => {
  return (
    <SectionItem title='tool.'>
      <div class={sectionContent}>
        <div class={flexRow} style={{ 'margin-bottom': vars.spacing.xs, gap: vars.spacing.lg }}>
          <For each={mainTools}>
            {(categoryId) => {
              const isInUse = () => categoryId === toolStore.activeToolCategory;
              return (
                <div>
                  <ToolItem categoryId={categoryId} withLabel='inUse' isInUse={isInUse()} />
                </div>
              );
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
