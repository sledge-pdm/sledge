import { css } from '@acab/ecsstatic';
import { Dropdown, Slider } from '@sledge-pdm/ui';
import { debounce } from '@solid-primitives/scheduled';
import { Component } from 'solid-js';
import { historyManager } from '~/features/history';
import { LayerPropsCommand } from '~/features/history/commands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
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
  let pendingAction: LayerPropsCommand | null = null;

  // TODO: debounce+ペンディングはマジで頭悪い 結局マウス離したときが確定でいいので、@sledge-pdm/uiのsliderに「マウスを離してchangeが終了したとき」のリスナーを追加してそのタイミングでaddEntryする
  const setHistory = () => {
    if (opacityTargetLayerId === null || opacityBeforeHistorySet === null || !pendingAction) return;
    const layer = findLayerById(opacityTargetLayerId);
    if (layer) {
      pendingAction.registerAfter(layer);
      if (pendingAction.hasDiff()) {
        historyManager.addEntry(new CommandsHistoryEntry([pendingAction]));
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
          value={activeLayer()?.mode}
          options={blendModeOptions}
          wheelSpin={true}
          onChange={(e) => {
            setLayerProp(activeLayer().id, 'mode', e);
          }}
        />
      </div>
      <div class={flexRow} style={{ width: '100%', 'align-items': 'center' }}>
        <p style={{ width: '40px' }}>{Math.ceil(activeLayer()?.opacity * 100)}%</p>
        <Slider
          value={activeLayer()?.opacity}
          min={0}
          max={1}
          allowFloat={true}
          floatSignificantDigits={2}
          labelMode={'none'}
          onPointerDownOnValidArea={(_e) => {
            const layer = activeLayer();
            opacityBeforeHistorySet = layer.opacity;
            opacityTargetLayerId = layer.id;
            pendingAction = new LayerPropsCommand({
              layerId: layer.id,
            });
            pendingAction.registerBefore(layer);
            return true;
          }}
          onChange={(newValue) => {
            if (opacityTargetLayerId) {
              setLayerProp(opacityTargetLayerId, 'opacity', newValue, {
                register: false, // Don't record per-change: commit a single history entry after debounce
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
