import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Dropdown, Slider } from '@sledge/ui';
import { confirm } from '@tauri-apps/plugin-dialog';
import { Component, createEffect, createSignal, For } from 'solid-js';
import SectionItem from '~/components/section/SectionItem';
import { setLayerProp } from '~/controllers/layer/LayerController';
import { activeLayer, addLayer, allLayers, moveLayer, removeLayer } from '~/controllers/layer/LayerListController';
import { useLongPressReorder } from '~/hooks/useLongPressReorder';
import { BlendModeOptions } from '~/models/layer/Layer';
import { layerListStore } from '~/stores/ProjectStores';
import { layerList } from '~/styles/section/editor/layer.css';
import { sectionContent } from '~/styles/section/section_item.css';
import { listenEvent } from '~/utils/TauriUtils';
import BaseLayerItem from './item/BaseLayerItem';
import LayerItem from './item/LayerItem';

const LayerList: Component<{}> = () => {
  const [items, setItems] = createSignal(allLayers());
  const [activeItem, setActiveItem] = createSignal<string | null>(null);
  const ids = () => items().map((l) => l.id);

  listenEvent('onSetup', () => {
    setItems(allLayers());
  });

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
      setActiveItem(null);
    },
  });

  return (
    <SectionItem title='layers.'>
      <div class={flexRow} style={{ 'margin-left': 'auto', gap: '4px', 'margin-bottom': '6px' }}>
        <button
          onClick={async () => {
            await addLayer({ name: 'layer1' });
            setItems(allLayers());
          }}
        >
          + add.
        </button>

        <button
          onClick={async () => {
            const ok = await confirm(`Sure to remove "${activeLayer().name}" ?\nYou can NOT restore this action.`, {
              kind: 'warning',
              title: 'Remove Layer',
              cancelLabel: 'Cancel',
              okLabel: 'Remove',
            });
            if (ok) {
              removeLayer(activeLayer()?.id);
              setItems(allLayers());
            }
          }}
          disabled={layerListStore.layers.length <= 1}
        >
          - remove.
        </button>
      </div>
      <div class={sectionContent}>
        <div
          class={flexRow}
          style={{
            'align-items': 'center',
            gap: vars.spacing.sm,
            'margin-bottom': vars.spacing.sm,
          }}
        >
          <div
            class={flexRow}
            style={{
              width: '120px',
              height: 'auto',
            }}
          >
            <Dropdown
              value={activeLayer().mode}
              options={BlendModeOptions}
              onChange={(e) => {
                setLayerProp(activeLayer().id, 'mode', e);
              }}
            />
          </div>
          <div class={flexRow} style={{ width: '100%', 'align-items': 'center' }}>
            <p style={{ width: '36px' }}>{Math.ceil(activeLayer().opacity * 100)}%</p>
            <Slider
              value={activeLayer().opacity}
              min={0}
              max={1}
              allowFloat={true}
              labelMode={'none'}
              onChange={(newValue) => {
                setLayerProp(activeLayer().id, 'opacity', newValue);
              }}
            />
          </div>
        </div>

        <div class={layerList} ref={(el) => (listRef = el)}>
          {/* <ImagePoolItem /> */}
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
