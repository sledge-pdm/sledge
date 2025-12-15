import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import LayerListButtonsRow from '~/components/section/editor/layer/row/LayerListButtonsRow';
import LayerListPropsRow from '~/components/section/editor/layer/row/LayerListPropsRow';
import SectionItem from '~/components/section/SectionItem';
import { allLayers, moveLayer } from '~/features/layer';
import { layerListStore } from '~/stores/ProjectStores';
import { createReorder } from '~/utils/useReorder';
import { sectionContent } from '../../SectionStyles';
import BaseLayerItem from './BaseLayerItem';
import LayerItem from './LayerItem';

const layerListSectionContent = css`
  padding-left: 2px;
  padding-right: 4px;
  padding-top: 2px;
  margin-top: 8px;
`;

const layerList = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  gap: 4px;
  margin-top: 8px;
  width: 100%;
  touch-action: none; /* prevent pen/scroll gestures from cancelling reorder */
`;

const selectionInfo = css`
  font-family: ZFB03B;
  /* color: var(--color-muted); */
  width: 100%;
  text-align: end;
  margin-top: 8px;
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
  const listContainerId = 'layer-list';
  const dnd = createReorder<string, string>({
    getItems: (container) => (container === listContainerId ? items().map((l) => l.id) : []),
    longPressMs: 350,
    onDrop: ({ fromIndex, toIndex, id }) => {
      const adjusted = toIndex > fromIndex ? toIndex - 1 : toIndex;
      handleMove(id, adjusted);
    },
  });

  return (
    <SectionItem title='layers.'>
      <div class={clsx(sectionContent, layerListSectionContent)}>
        <LayerListButtonsRow onUpdate={(type) => setItems(allLayers())} />
        <LayerListPropsRow />

        <Show when={layerListStore.selected.size > 0}>
          <p class={selectionInfo}>{layerListStore.selected.size} layers selected.</p>
        </Show>

        <div
          class={layerList}
          ref={(el) => {
            dnd.registerContainer(listContainerId, el ?? null);
          }}
        >
          <For each={items()}>
            {(layer, index) => {
              return (
                <div
                  ref={(el) => dnd.registerItem(listContainerId, el, layer.id)}
                  onPointerDown={(e) => dnd.onPointerDown(e, listContainerId, layer.id)}
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
