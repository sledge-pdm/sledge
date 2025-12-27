import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Component } from 'solid-js';
import LayerListIconButton from '~/components/section/editor/layer/row/LayerListIconButton';
import { addLayer, findLayerById } from '~/features/layer';
import {
  clearLayersFromUser,
  duplicateLayers,
  getSelectedLayers,
  mergeToBelowLayer,
  removeLayersFromUser,
  toggleLayerVisibility,
} from '~/features/layer/service';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
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
  const targets = () => getSelectedLayers();
  const targetCount = () => targets().length;
  const targetLayerId = () => targets()[0];
  const areTargetsEnabled = () => targets().every((id) => findLayerById(id)?.enabled);
  const visibilityIcon = () => (areTargetsEnabled() ? '/icons/layer/visible_9.png' : '/icons/layer/invisible_9.png');
  const visibilityTitle = () => (areTargetsEnabled() ? 'hide selected layer(s).' : 'show selected layer(s).');
  const isBottomLayerTarget = () => layerListStore.layers.findIndex((l) => l.id === targetLayerId()) === layerListStore.layers.length - 1;
  const isRemoveDisabled = () => layerListStore.layers.length <= 1 || layerListStore.layers.length === targetCount();

  return (
    <div class={flexRow}>
      <div class={iconsContainer}>
        <LayerListIconButton
          iconSrc={'/icons/layer/clear_9.png'}
          title={'clear selected layer(s).'}
          onClick={async () => await clearLayersFromUser()}
        />
        <LayerListIconButton
          iconSrc={visibilityIcon()}
          title={visibilityTitle()}
          onClick={() => {
            toggleLayerVisibility();
          }}
        />
        <LayerListIconButton
          iconSrc={'/icons/layer/duplicate_9.png'}
          title={'duplicate selected layer(s).'}
          onClick={() => {
            duplicateLayers();
          }}
        />
        <LayerListIconButton
          iconSrc={'/icons/layer/merge_down_9.png'}
          title={'merge down to below layer.'}
          disabled={targetCount() !== 1 || isBottomLayerTarget()}
          onClick={async () => {
            const target = targetLayerId();
            if (target) {
              await mergeToBelowLayer(target);
            }
          }}
        />
        <LayerListIconButton
          iconSrc={'/icons/layer/selection_mode_9.png'}
          title={'toggle layer selection mode.'}
          // disabled={appearanceStore.selectionEnabled}
          iconColor={layerListStore.selectionEnabled ? color.enabled : color.onBackground}
          onClick={async () => {
            setLayerListStore('selectionEnabled', (v) => !v);
            setLayerListStore('selected', new Set());
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
          disabled={isRemoveDisabled()}
          onClick={async () => {
            await removeLayersFromUser();
            props.onUpdate?.('remove');
          }}
        >
          - REMOVE.
        </button>
      </div>
    </div>
  );
};

export default LayerListButtonsRow;
