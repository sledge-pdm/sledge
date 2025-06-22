import { Component, For } from 'solid-js';
import { toolStore } from '~/stores/EditorStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/globals/section_global.css';
import { ToolType } from '~/tools/Tools';
import ToolItem from './item/ToolItem';

const showingTools: ToolType[] = [ToolType.Pen, ToolType.Eraser];

const ToolList: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>tools.</p>
      <div class={sectionContent}>
        <For each={Object.entries(toolStore.tools)}>
          {([type, tool], index) => {
            let toolType = type as ToolType;
            if (showingTools.includes(toolType)) {
              return <ToolItem toolType={toolType} tool={tool} isInUse={toolType === toolStore.activeType} />;
            }
          }}
        </For>
      </div>
    </div>
  );
};

export default ToolList;
