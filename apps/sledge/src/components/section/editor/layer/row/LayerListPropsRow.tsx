import { css } from '@acab/ecsstatic';
import { Dropdown, Slider } from '@sledge/ui';
import { Component } from 'solid-js';
import { LayerPropsHistoryAction, projectHistoryController } from '~/features/history';
import { activeLayer, blendModeOptions, setLayerProp } from '~/features/layer';
import { layerListStore } from '~/stores/ProjectStores';
import { flexRow } from '~/styles/styles';

const layerConfigRow = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
`;

// mode, opacity
const LayerListPropsRow: Component = () => {
  // Debounce state for opacity change history aggregation
  let opacityCommitTimer: number | undefined;
  let opacityHistoryBefore: Omit<ReturnType<typeof activeLayer>, 'id'> | null = null;
  let opacityHistoryLayerId: string | null = null;
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
          onChange={(newValue) => {
            // Debounced history: apply change immediately without diff, then commit once after 500ms idle
            const layer = activeLayer();
            // capture BEFORE snapshot only at the beginning of a burst
            if (!opacityCommitTimer) {
              const { id: _id, ...beforeProps } = layer as any;
              opacityHistoryBefore = beforeProps;
              opacityHistoryLayerId = layer.id;
            }

            setLayerProp(layer.id, 'opacity', newValue, {
              noDiff: true, // Don't record per-change: commit a single history entry after debounce
            });

            if (opacityCommitTimer) window.clearTimeout(opacityCommitTimer);
            opacityCommitTimer = window.setTimeout(() => {
              try {
                if (!opacityHistoryLayerId || !opacityHistoryBefore) return;
                const latest = layerListStore.layers.find((l) => l.id === opacityHistoryLayerId);
                if (!latest) return;
                const { id: _id2, ...afterProps } = latest as any;
                const act = new LayerPropsHistoryAction({
                  layerId: opacityHistoryLayerId,
                  oldLayerProps: opacityHistoryBefore as any,
                  newLayerProps: afterProps as any,
                  context: {
                    from: 'LayerList.opacitySlider(debounced 500ms)',
                    propName: 'opacity',
                    before: String(opacityHistoryBefore.opacity),
                    after: String(afterProps.opacity),
                  },
                });
                projectHistoryController.addAction(act);
              } finally {
                opacityCommitTimer = undefined as any;
                opacityHistoryBefore = null;
                opacityHistoryLayerId = null;
              }
            }, 200) as any;
          }}
        />
      </div>
    </div>
  );
};

export default LayerListPropsRow;
