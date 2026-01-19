import { css } from '@acab/ecsstatic';
import { color } from '@sledge-pdm/ui';
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
import { projectStore, setProjectStore } from '~/stores/RuntimeProject';
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
  const visibilityIcon = () => (areTargetsEnabled() ? '/assets/icons/layer/visible_9.png' : '/assets/icons/layer/invisible_9.png');
  const visibilityTitle = () => (areTargetsEnabled() ? 'hide selected layer(s).' : 'show selected layer(s).');
  const isBottomLayerTarget = () => projectStore.layers.layers.findIndex((l) => l.id === targetLayerId()) === projectStore.layers.layers.length - 1;
  const isRemoveDisabled = () => projectStore.layers.layers.length <= 1 || projectStore.layers.layers.length === targetCount();

  return (
    <div class={flexRow}>
      <div class={iconsContainer}>
        <LayerListIconButton
          iconSrc={'/assets/icons/layer/clear_9.png'}
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
          iconSrc={'/assets/icons/layer/duplicate_9.png'}
          title={'duplicate selected layer(s).'}
          onClick={() => {
            duplicateLayers();
          }}
        />
        <LayerListIconButton
          iconSrc={'/assets/icons/layer/merge_down_9.png'}
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
          iconSrc={'/assets/icons/layer/selection_mode_9.png'}
          title={'toggle layer selection mode.'}
          // disabled={appearanceStore.selectionEnabled}
          iconColor={projectStore.layers.state.selectionEnabled ? color.enabled : color.onBackground}
          onClick={async () => {
            setProjectStore('layers', 'state', 'selectionEnabled', (v) => !v);
            setProjectStore('layers', 'state', 'selected', new Set());
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
