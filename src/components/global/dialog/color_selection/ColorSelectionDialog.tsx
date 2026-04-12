import { css } from '@acab/ecsstatic';
import { color, ColorBox, Dialog, Icon, RadioButton, Slider } from '@sledge-pdm/ui';
import { Component, createMemo, Show } from 'solid-js';
import {
  applyColorSelection,
  cancelColorSelectionPick,
  closeColorSelectionDialog,
  colorSelectionStore,
  setColorSelectionMode,
  setColorSelectionTarget,
  setColorSelectionThreshold,
  startColorSelectionPick,
} from '~/features/selection/color_selection';
import { SelectionModeSelector } from '~/features/tools/presets/SelectionModeField';
import { flexCol } from '~/styles/styles';

const contentRoot = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 248px;
  padding: 12px;
`;

const row = css`
  display: flex;
  flex-direction: row;
  align-items: start;
  gap: 8px;
`;

const label = css`
  width: 72px;
  color: var(--color-muted);
  flex-shrink: 0;
`;

const targetText = css`
  min-width: 48px;
  color: var(--color-on-background);
  text-transform: lowercase;
`;

const iconButton = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: 1px solid var(--color-border);
  background-color: transparent;

  &:hover {
    border-color: var(--color-active);
  }
`;

const sliderContainer = css`
  width: 100%;
`;

const actions = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const applyButton = css`
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  background-color: transparent;

  &:hover:enabled {
    border-color: var(--color-active);
    color: var(--color-active);
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const helperText = css`
  color: var(--color-active);
  opacity: 0.75;
  min-height: 2em;
`;

const ColorSelectionDialog: Component = () => {
  const initialPosition = createMemo(() => ({
    x: Math.max(24, window.innerWidth - 296),
    y: 72,
  }));

  const isCanvasTarget = createMemo(() => colorSelectionStore.target === 'canvas');
  const targetTextValue = createMemo(() => (isCanvasTarget() ? 'canvas.' : 'layer.'));

  return (
    <Dialog title='Color Selection.' onClose={closeColorSelectionDialog} initialPosition={initialPosition()}>
      <div class={contentRoot}>
        <div class={row}>
          <p class={label}>color.</p>
          <ColorBox color={colorSelectionStore.targetColor} sizePx={24} forceBorderColor={color.onBackground} />
          <button
            type='button'
            class={iconButton}
            title='Pick target color'
            aria-label='Pick target color'
            onClick={() => {
              if (colorSelectionStore.isPicking) {
                cancelColorSelectionPick();
                return;
              }
              startColorSelectionPick();
            }}
          >
            <Icon
              src='/assets/icons/tools/pipette.png'
              base={8}
              scale={2}
              color={colorSelectionStore.isPicking ? color.active : color.onBackground}
              hoverColor={color.active}
            />
          </button>
        </div>

        <div class={row}>
          <p class={label}>target.</p>
          <div class={flexCol} style={{ gap: '8px' }}>
            <RadioButton
              name='color-selection-target'
              label='canvas'
              labelMode='right'
              value={isCanvasTarget()}
              onChange={() => setColorSelectionTarget('canvas')}
            />
            <RadioButton
              name='color-selection-target'
              label='layer'
              labelMode='right'
              value={!isCanvasTarget()}
              onChange={() => setColorSelectionTarget('layer')}
            />
          </div>
        </div>

        <div class={row}>
          <p class={label}>tolerance.</p>
          <div class={sliderContainer}>
            <Slider labelMode='left' labelWidth={40} min={0} max={255} value={colorSelectionStore.threshold} onChange={setColorSelectionThreshold} />
          </div>
        </div>
        <Show when={colorSelectionStore.isPicking}>
          <p class={helperText}>click canvas to pick color. shift+click keeps pipette active.</p>
        </Show>
        <div class={actions}>
          <SelectionModeSelector
            value={colorSelectionStore.mode}
            onSelectMode={(mode) => {
              if (mode !== 'move') setColorSelectionMode(mode);
            }}
            modes={['replace', 'add', 'subtract']}
          />
          <button type='button' class={applyButton} onClick={applyColorSelection} disabled={colorSelectionStore.isPicking}>
            apply
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ColorSelectionDialog;
