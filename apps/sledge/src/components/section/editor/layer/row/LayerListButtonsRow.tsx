import { css } from '@acab/ecsstatic';
import { confirm } from '@tauri-apps/plugin-dialog';
import { Component } from 'solid-js';
import LayerListIconButton from '~/components/section/editor/layer/row/LayerListIconButton';
import { activeLayer, addLayer } from '~/features/layer';
import { clearLayer, duplicateLayer, removeLayerFromUser, setLayerProp } from '~/features/layer/service';
import { layerListStore } from '~/stores/ProjectStores';
import { errorButton, flexRow } from '~/styles/styles';

const iconsContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-left: 2px;
`;

const addRemoveContainer = css`
  display: flex;
  flex-direction: row;
  margin-left: auto;
  gap: 8px;
`;

interface Props {
  onUpdate?: (type: 'add' | 'remove') => void;
}

const LayerListButtonsRow: Component<Props> = (props) => {
  return (
    <div class={flexRow}>
      <div class={iconsContainer}>
        <LayerListIconButton
          iconSrc={'/icons/sections/layer/clear_9.png'}
          title={'clear layer.'}
          onClick={async () => {
            const clearConfirmed = await confirm(`Sure to clear layer "${activeLayer().name}"?`);
            if (clearConfirmed) clearLayer(layerListStore.activeLayerId);
          }}
        />
        <LayerListIconButton
          iconSrc={activeLayer().enabled ? '/icons/misc/visible_9.png' : '/icons/misc/invisible_9.png'}
          title={activeLayer().enabled ? 'hide layer.' : 'show layer.'}
          onClick={() => {
            const active = activeLayer();
            if (active) {
              setLayerProp(active.id, 'enabled', !active.enabled);
            }
          }}
        />
        <LayerListIconButton
          iconSrc={'/icons/sections/layer/duplicate_9.png'}
          title={'duplicate layer.'}
          onClick={() => {
            duplicateLayer(layerListStore.activeLayerId);
          }}
        />
      </div>
      <div class={addRemoveContainer}>
        <button
          onClick={() => {
            addLayer({ name: 'layer 1' });
            props.onUpdate?.('add');
          }}
        >
          + ADD.
        </button>
        <button
          class={errorButton}
          onClick={async () => {
            const active = activeLayer();
            if (active) {
              await removeLayerFromUser(active.id);
              props.onUpdate?.('remove');
            }
          }}
        >
          - REMOVE.
        </button>
      </div>
    </div>
  );
};

export default LayerListButtonsRow;
