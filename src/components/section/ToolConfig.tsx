import { Component, For } from 'solid-js';
import { toolStore } from '~/stores/EditorStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/globals/section_global.css';
import { ToolType } from '~/tools/Tools';
import ToolItem from './item/ToolItem';

const ToolConfig: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>tools.</p>
      <div class={sectionContent}>
        <For each={Object.entries(toolStore.tools)}>
          {([toolType, tool], index) => <ToolItem toolType={toolType as ToolType} tool={tool} isInUse={toolType === toolStore.activeType} />}
        </For>
      </div>
    </div>
  );
};

export default ToolConfig;
