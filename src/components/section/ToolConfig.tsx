import { Component, For } from 'solid-js';
import PenItem from './item/PenItem';
import PenSize from './item/PenSize';
import { toolStore } from '~/stores/internal/toolsStore';
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from '~/styles/section_global.css';

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
