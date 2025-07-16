import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, For, Show } from 'solid-js';
import PresetEditor from '~/components/section/editor/item/PresetEditor';
import { toolStore } from '~/stores/EditorStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section_item.css';
import { ToolCategoryId } from '~/tools/Tools';
import ToolItem from './item/ToolItem';

const mainTools: ToolCategoryId[] = ['pen', 'eraser', 'fill'];

const Draw: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>draw.</p>
      <div class={sectionContent}>
        <div class={flexRow} style={{ 'margin-bottom': vars.spacing.xs, gap: vars.spacing.lg }}>
          <For each={mainTools}>
            {(categoryId) => {
              const isInUse = () => categoryId === toolStore.activeToolCategory;
              return (
                <div style={{ 'flex-grow': isInUse() ? 1 : 0 }}>
                  {/**, order: isInUse() ? 0 : 1  */}
                  <ToolItem categoryId={categoryId} withLabel='inUse' isInUse={isInUse()} />
                </div>
              );
            }}
          </For>
        </div>

        <Show when={mainTools.includes(toolStore.activeToolCategory)}>
          <div style={{ margin: '12px 4px' }}>
            <PresetEditor categoryId={toolStore.activeToolCategory} presetId={toolStore.tools[toolStore.activeToolCategory].presets?.selected} />
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Draw;
