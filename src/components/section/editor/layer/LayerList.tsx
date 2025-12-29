import { css } from '@acab/ecsstatic';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { clsx } from '@sledge-pdm/core';
import { Component, createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import LayerListButtonsRow from '~/components/section/editor/layer/row/LayerListButtonsRow';
import LayerListPropsRow from '~/components/section/editor/layer/row/LayerListPropsRow';
import SectionItem from '~/components/section/SectionItem';
import { allLayers, moveLayer } from '~/features/layer';
import { layerListStore } from '~/stores/ProjectStores';
import { ensureDropLine, getDropCandidates, getDropIndex, hideDropLine, updateDropLine } from '~/utils/dndUtils';
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
`;

const selectionInfo = css`
  font-family: ZFB03B;
  /* color: var(--color-muted); */
  width: 100%;
  text-align: end;
  margin-top: 8px;
`;

const LayerList: Component = () => {
  const [items, setItems] = createSignal(allLayers());
  let listEl: HTMLDivElement | undefined;
  let dropLineEl: HTMLDivElement | null = null;

  createEffect(() => {
    setItems(allLayers());
  });

  const getDropIndexForLayer = (sourceId: string, clientY: number) => {
    if (!listEl) return -1;
    const candidates = getDropCandidates(listEl, '[data-layer-id]', sourceId, (el) => el.dataset.layerId);
    return getDropIndex(candidates, clientY);
  };

  onMount(() => {
    if (!listEl) return;
    const cleanup = dropTargetForElements({
      element: listEl,
      canDrop: ({ source }) => {
        const data = source.data as { type?: string };
        return data?.type === 'layer';
      },
      onDrop: ({ source, location }) => {
        const data = source.data as { type?: string; id?: string };
        if (data?.type !== 'layer' || !data.id) return;
        const layers = allLayers();
        const fromIndex = layers.findIndex((layer) => layer.id === data.id);
        if (fromIndex < 0) return;
        const toIndex = getDropIndexForLayer(data.id, location.current.input.clientY);
        if (toIndex < 0 || toIndex === fromIndex) return;
        moveLayer(fromIndex, toIndex);
        hideDropLine(dropLineEl);
      },
      onDrag: ({ source, location }) => {
        const data = source.data as { type?: string; id?: string };
        if (data?.type !== 'layer' || !data.id || !listEl) return;
        const layers = allLayers();
        const fromIndex = layers.findIndex((layer) => layer.id === data.id);
        if (fromIndex < 0) return;
        const candidates = getDropCandidates(listEl, '[data-layer-id]', data.id, (el) => el.dataset.layerId);
        const toIndex = getDropIndex(candidates, location.current.input.clientY);
        if (toIndex < 0 || toIndex === fromIndex) {
          hideDropLine(dropLineEl);
          return;
        }
        dropLineEl = ensureDropLine(listEl, dropLineEl);
        updateDropLine(dropLineEl, listEl, candidates, toIndex, 3);
      },
      onDragLeave: () => {
        hideDropLine(dropLineEl);
      },
    });

    onCleanup(() => cleanup());
  });

  return (
    <SectionItem title='layers.'>
      <div class={clsx(sectionContent, layerListSectionContent)}>
        <LayerListButtonsRow onUpdate={(type) => setItems(allLayers())} />
        <LayerListPropsRow />

        <Show when={layerListStore.selected.size > 0}>
          <p class={selectionInfo}>{layerListStore.selected.size} layers selected.</p>
        </Show>

        <div class={layerList} ref={(el) => (listEl = el)}>
          <For each={items()}>
            {(layer, index) => {
              return <LayerItem layer={layer} index={index()} isLast={index() === items().length - 1} />;
            }}
          </For>
          <BaseLayerItem />
        </div>
      </div>
    </SectionItem>
  );
};

export default LayerList;
