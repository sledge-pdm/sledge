import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { Component, createEffect, createSignal, For } from 'solid-js';
import LayerListButtonsRow from '~/components/section/editor/layer/row/LayerListButtonsRow';
import LayerListPropsRow from '~/components/section/editor/layer/row/LayerListPropsRow';
import SectionItem from '~/components/section/SectionItem';
import { allLayers, moveLayer } from '~/features/layer';
import { layerListStore } from '~/stores/ProjectStores';
import { listenEvent } from '~/utils/TauriUtils';
import { useLongPressReorder } from '~/utils/useLongPressReorder';
import { sectionContent } from '../../SectionStyles';
import BaseLayerItem from './BaseLayerItem';
import LayerItem from './LayerItem';

const layerListSectionContent = css`
  padding-left: 2px;
  padding-right: 4px;
  padding-top: 2px;
`;

const layerList = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  gap: 4px;
  margin-top: 8px;
  width: 100%;
`;

const LayerList: Component<{}> = () => {
  const [items, setItems] = createSignal(allLayers());

  createEffect(() => {
    setItems(allLayers());
  });

  function handleMove(draggedId: string, targetIndex: number) {
    const fromIndex = layerListStore.layers.findIndex((l) => l.id === draggedId);
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    moveLayer(fromIndex, targetIndex);
    setItems(allLayers());
  }

  // DnD hook wiring
  let listRef: HTMLDivElement | undefined;
  const dnd = useLongPressReorder({
    getItems: items,
    getId: (l) => l.id,
    containerRef: () => listRef,
    longPressMs: 350,
    onDrop: (from, to, id) => {
      const adjusted = to > from ? to - 1 : to;
      handleMove(id, adjusted);
    },
  });

  return (
    <SectionItem title='layers.'>
      <div class={clsx(sectionContent, layerListSectionContent)}>
        <LayerListButtonsRow onUpdate={(type) => setItems(allLayers())} />
        <LayerListPropsRow />

        <div class={layerList} ref={(el) => (listRef = el)}>
          <For each={items()}>
            {(layer, index) => {
              return (
                <div
                  ref={(el) => dnd.registerItem(el, layer.id)}
                  onPointerDown={(e) => dnd.onPointerDown(e, layer.id)}
                  // isolate pointer to allow intentional long-press without scrolling
                  style={{ 'touch-action': 'none' }}
                >
                  <LayerItem layer={layer} index={index()} isLast={index() === items().length - 1} />
                </div>
              );
            }}
          </For>
          <BaseLayerItem />
        </div>
      </div>
    </SectionItem>
  );
};

export default LayerList;
