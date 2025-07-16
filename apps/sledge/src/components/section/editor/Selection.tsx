import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, For } from 'solid-js';
import { toolStore } from '~/stores/EditorStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section_item.css';

import { ToolCategoryId } from '~/tools/Tools';
import ToolItem from './item/ToolItem';

const mainTools: ToolCategoryId[] = ['rectSelection', 'selectionMove', 'move'];

const Selection: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>selection.</p>
      <div class={sectionContent}>
        <div class={flexRow} style={{ 'margin-bottom': vars.spacing.xs, gap: vars.spacing.lg }}>
          <For each={mainTools}>
            {(categoryId) => {
              return <ToolItem categoryId={categoryId} isInUse={categoryId === toolStore.activeToolCategory} />;
            }}
          </For>
        </div>
      </div>
    </div>
  );
};

export default Selection;
