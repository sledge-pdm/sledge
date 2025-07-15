import { flexCol, w100 } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, For } from 'solid-js';
import ToolItemSub from '~/components/section/editor/item/ToolItemSub';
import { toolStore } from '~/stores/EditorStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section.css';
import { ToolType } from '~/tools/Tools';
import ToolItemMain from './item/ToolItemMain';

const mainTools: ToolType[] = [ToolType.Pen, ToolType.Eraser];
const subTools: ToolType[] = [ToolType.Fill, ToolType.RectSelection, ToolType.SelectionMove, ToolType.Move];

const ToolList: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>tools.</p>
      <div class={sectionContent}>
        <div class={flexCol} style={{ 'margin-bottom': vars.spacing.xs }}>
          <For each={mainTools}>
            {(type, index) => {
              const tool = toolStore.tools[type];
              return <ToolItemMain toolType={type} tool={tool} isInUse={type === toolStore.activeType} />;
            }}
          </For>
        </div>
        <div class={w100} style={{ display: 'grid', 'grid-template-columns': 'repeat(auto-fill, 32px)' }}>
          <For each={subTools}>
            {(type, index) => {
              const tool = toolStore.tools[type];
              return <ToolItemSub toolType={type} tool={tool} isInUse={type === toolStore.activeType} />;
            }}
          </For>
        </div>
      </div>
    </div>
  );
};

export default ToolList;
