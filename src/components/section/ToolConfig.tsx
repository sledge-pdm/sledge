import { Component, For } from 'solid-js';
import { toolStore } from '~/stores/EditorStores';
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from '~/styles/section_global.css';
import PenItem from './item/PenItem';
import PenSize from './item/PenSize';

const ToolConfig: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>tools.</p>
      <div class={sectionContent}>
        <PenSize />
        <For each={toolStore.tools}>
          {(item, index) => (
            <PenItem pen={item} isInUse={index() === toolStore.usingIndex} />
          )}
        </For>
      </div>
    </div>
  );
};

export default ToolConfig;
