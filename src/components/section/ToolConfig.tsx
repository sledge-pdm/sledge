import { Component, For } from 'solid-js';
import { toolStore } from '~/stores/EditorStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/globals/section_global.css';
import ToolItem from './item/ToolItem';

const ToolConfig: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>tools.</p>
      <div class={sectionContent}>
        <For each={toolStore.tools}>{(item, index) => <ToolItem tool={item} isInUse={index() === toolStore.usingIndex} />}</For>
      </div>
    </div>
  );
};

export default ToolConfig;
