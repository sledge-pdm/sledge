import { css } from '@acab/ecsstatic';
import { Dropdown, Slider } from '@sledge/ui';
import { debounce } from '@solid-primitives/scheduled';
import { Component } from 'solid-js';
import { LayerPropsHistoryAction, projectHistoryController } from '~/features/history';
import { activeLayer, blendModeOptions, findLayerById, setLayerProp } from '~/features/layer';
import { flexRow } from '~/styles/styles';

const layerConfigRow = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
`;

const LayerListPropsRow: Component = () => {
  let opacityBeforeHistorySet: number | null = null;
  let opacityTargetLayerId: string | null = null;
  let pendingAction: LayerPropsHistoryAction | null = null;

  const setHistory = () => {
    if (opacityTargetLayerId === null || opacityBeforeHistorySet === null || !pendingAction) return;
    const layer = findLayerById(opacityTargetLayerId);
    if (layer) {
      pendingAction.registerAfter(layer);
      if (pendingAction.hasDiff()) {
        projectHistoryController.addAction(pendingAction);
      }
    }

    opacityBeforeHistorySet = null;
    opacityTargetLayerId = null;
    pendingAction = null;
  };

  const setHistoryDebounced = debounce(setHistory, 200);

  return (
    <div class={layerConfigRow}>
      <div
        class={flexRow}
        style={{
          width: '200px',
          height: 'auto',
        }}
      >
        <Dropdown
          value={activeLayer().mode}
          options={blendModeOptions}
          wheelSpin={true}
          onChange={(e) => {
            setLayerProp(activeLayer().id, 'mode', e);
          }}
        />
      </div>
      <div class={flexRow} style={{ width: '100%', 'align-items': 'center' }}>
        <p style={{ width: '40px' }}>{Math.ceil(activeLayer().opacity * 100)}%</p>
        <Slider
          value={activeLayer().opacity}
          min={0}
          max={1}
          allowFloat={true}
          floatSignificantDigits={2}
          labelMode={'none'}
          onPointerDownOnValidArea={(_e) => {
            const layer = activeLayer();
            opacityBeforeHistorySet = layer.opacity;
            opacityTargetLayerId = layer.id;
            pendingAction = new LayerPropsHistoryAction({
              layerId: layer.id,
              context: {
                from: 'LayerList.opacitySlider(debounced)',
                propName: 'opacity',
                before: String(layer.opacity),
              },
            });
            pendingAction.registerBefore(layer);
            return true;
          }}
          onChange={(newValue) => {
            if (opacityTargetLayerId) {
              setLayerProp(opacityTargetLayerId, 'opacity', newValue, {
                noDiff: true, // Don't record per-change: commit a single history entry after debounce
              });
              // 更新後の値を記録
              pendingAction?.registerAfter();
              setHistoryDebounced();
            }
          }}
        />
      </div>
    </div>
  );
};

export default LayerListPropsRow;
