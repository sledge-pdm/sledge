import { css } from '@acab/ecsstatic';
import { Dropdown, Slider } from '@sledge-pdm/ui';
import { debounce } from '@solid-primitives/scheduled';
import { Component, onCleanup } from 'solid-js';
import { beginEditSession } from '~/features/edit_session';
import { registerCommandsHistory } from '~/features/history';
import { LayerPropsCommand } from '~/features/history/commands';
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
  /** closes the edit session the waiting history entry holds; undefined while none is waiting. */
  let endSession: (() => void) | undefined;

  // TODO: debounce+ペンディングはマジで頭悪い 結局マウス離したときが確定でいいので、@sledge-pdm/uiのsliderに「マウスを離してchangeが終了したとき」のリスナーを追加してそのタイミングでaddEntryする
  const setHistory = () => {
    if (opacityTargetLayerId === null || opacityBeforeHistorySet === null || !pendingAction) return;
    const layer = findLayerById(opacityTargetLayerId);
    if (layer) {
      pendingAction.registerAfter(layer);
      if (pendingAction.hasDiff()) {
        registerCommandsHistory([pendingAction]);
      }
    }

    opacityBeforeHistorySet = null;
    opacityTargetLayerId = null;
    pendingAction = null;

    endSession?.();
    endSession = undefined;
  };

  const setHistoryDebounced = debounce(setHistory, 200);

  // the opacity already applied to the layer; only its history entry is waiting on that 200ms. anything
  // arriving inside the wait would find the new opacity with nothing in history to undo it, so the wait is
  // an edit session: settling it registers the entry now and drops the timer. `setHistory` clears the
  // pending state, so it cannot run twice.
  const settlePendingOpacity = () => {
    setHistoryDebounced.clear();
    setHistory();
  };

  // opened from `onChange` rather than from the pointer coming down, because what the session stands for is
  // the entry waiting on the timer, and only a change starts that timer. a press that ends without one -
  // the slider's own pointercancel path does exactly that - would otherwise leave a session open with
  // nothing left to settle it, and every guarded edit would be turned down from then on.
  const openOpacitySession = () => {
    if (endSession) return;
    endSession = beginEditSession({
      label: 'layer opacity',
      isExclusive: () => pendingAction !== null,
      interrupt: settlePendingOpacity,
      finalize: settlePendingOpacity,
    });
  };

  onCleanup(() => {
    // the row is going away with an entry still waiting on its timer; register it rather than losing it.
    settlePendingOpacity();
  });

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
              openOpacitySession();
            }
          }}
        />
      </div>
    </div>
  );
};

export default LayerListPropsRow;
