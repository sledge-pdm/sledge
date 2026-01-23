import { css } from '@acab/ecsstatic';
import { Component, createEffect, createSignal } from 'solid-js';
import { adjustZoomToFit, centeringCanvas, changeCanvasSize, setRotation } from '~/features/canvas';
import { logSystemInfo } from '~/features/log/service';

import { Button, color, Dropdown, Icon } from '@sledge-pdm/ui';
import SectionItem from '~/components/section/SectionItem';
import { Consts } from '~/Consts';
import { canvasSizePresets, canvasSizePresetsDropdownOptions } from '~/features/canvas';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { sectionContent } from '../SectionStyles';

const canvasContentStyle = css`
  gap: 8px;
  margin-top: 16px;
  padding-bottom: 20px;
`;

const frameModeButtonContainerStyle = css`
  display: flex;
  flex-direction: row;
  margin-left: auto;
  gap: 8px;
  align-items: center;
  cursor: pointer;
`;

const presetRowStyle = css`
  display: flex;
  align-items: center;
  margin-bottom: 2px;
`;

const presetDropdownContainer = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const presetLabel = css`
  font-family: ZFB03;
  margin-right: 8px;
  color: var(--color-muted);
`;

const canvasSizeFormStyle = css`
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
`;

const canvasSizeTimesStyle = css`
  font-size: var(--text-xl);
  margin-bottom: var(--spacing-xs);
`;

const canvasSizeLabelStyle = css`
  font-family: ZFB03;
  font-size: var(--text-sm);
  color: var(--color-muted);
  margin-bottom: 1px;
  margin-left: 3px;
`;

const canvasSizeInputStyle = css`
  font-size: var(--text-xl);
  width: 64px;
`;

const canvasSizeButtonStyle = css`
  margin: var(--spacing-xs) 0;
  margin-left: auto;
`;

const defaultButtonContainerStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 8px;
  align-items: end;
  gap: 4px;
`;

const defaultInfoStyle = css`
  font-family: ZFB08;
  font-size: 8px;
  opacity: 0.65;
`;

const actionsContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 16px;
  align-items: end;
`;

const adjustZoomButtonStyle = css`
  margin-top: 8px;
`;

const CanvasSettings: Component = () => {
  let widthInputRef: HTMLInputElement;
  let heightInputRef: HTMLInputElement;

  const submitSizeChange = () => {
    const width = Number(widthInputRef.value);
    const height = Number(heightInputRef.value);
    const newSize = { width, height };

    const result = changeCanvasSize(newSize, {
      skipHistory: false,
    });
    if (result) adjustZoomToFit();
  };

  const [isChangable, setIsChangable] = createSignal(false);
  const [sizePreset, setSizePreset] = createSignal<string>('undefined');

  createEffect(() => {
    projectStore.canvas.size;

    logSystemInfo('CanvasSettings: canvas changed', { label: 'CanvasSettings', details: [projectStore.canvas.size], debugOnly: true });
    updateButtonState();
    updateCurrentPreset();
  });

  const updateButtonState = () => {
    if (!widthInputRef || !heightInputRef) {
      setIsChangable(false);
      return;
    }
    const changable =
      Number(widthInputRef.value) !== projectStore.canvas.size.width || Number(heightInputRef.value) !== projectStore.canvas.size.height;
    setIsChangable(changable);
  };

  const updateCurrentPreset = () => {
    const cw = widthInputRef ? Number(widthInputRef.value) : projectStore.canvas.size.width;
    const ch = heightInputRef ? Number(heightInputRef.value) : projectStore.canvas.size.height;
    const matchedPreset = Object.entries(canvasSizePresets).find(([key, c]) => c?.width === cw && c?.height === ch);

    if (matchedPreset) {
      const [key, canvas] = matchedPreset;
      setSizePreset(JSON.stringify(canvas));
    } else {
      setSizePreset('undefined'); // custom
    }
  };

  const handlePresetChange = (value: string) => {
    if (value === 'undefined') {
      const canvas = projectStore.canvas.size;
      widthInputRef.value = canvas.width.toString();
      heightInputRef.value = canvas.height.toString();
      setSizePreset('undefined');
    } else {
      const canvas = JSON.parse(value);
      if (canvas) {
        widthInputRef.value = canvas.width.toString();
        heightInputRef.value = canvas.height.toString();
        setSizePreset(JSON.stringify(canvas));
      }
    }
    updateButtonState();
  };

  createEffect(() => {
    const rotation = interactStore.rotation;
    if (interactStore.isCanvasSizeFrameMode && rotation !== 0) {
      setRotation(0);
    }
  });

  return (
    <SectionItem title='canvas.'>
      <div class={`${sectionContent} ${canvasContentStyle}`}>
        <div class={presetRowStyle}>
          <div class={presetDropdownContainer}>
            <p class={presetLabel}>preset</p>
            <Dropdown options={canvasSizePresetsDropdownOptions} value={sizePreset} onChange={handlePresetChange} wheelSpin={true} />
          </div>
          <div
            class={frameModeButtonContainerStyle}
            onClick={async () => {
              setInteractStore('isCanvasSizeFrameMode', (v) => !v);
              if (interactStore.isCanvasSizeFrameMode) {
                setInteractStore('horizontalFlipped', false);
                setInteractStore('verticalFlipped', false);
                adjustZoomToFit();
                selectionManager.clear();
              }
            }}
          >
            <Icon
              src={'/assets/icons/misc/frame_resize_12.png'}
              base={12}
              scale={1}
              color={interactStore.isCanvasSizeFrameMode ? color.error : undefined}
              hoverColor={interactStore.isCanvasSizeFrameMode ? color.error : color.enabled}
            />
          </div>
        </div>
        <div class={canvasSizeFormStyle}>
          <div>
            <p class={canvasSizeLabelStyle}>width</p>
            <input
              ref={(el) => (widthInputRef = el)}
              class={canvasSizeInputStyle}
              type='number'
              name='width'
              value={projectStore.canvas.size.width}
              min={Consts.minCanvasWidth}
              max={Consts.maxCanvasWidth}
              onInput={() => {
                updateButtonState();
                updateCurrentPreset();
              }}
              required
            />
          </div>

          <p class={canvasSizeTimesStyle}>x</p>

          <div>
            <p class={canvasSizeLabelStyle}>height</p>
            <input
              ref={(el) => (heightInputRef = el)}
              class={canvasSizeInputStyle}
              type='number'
              name='height'
              value={projectStore.canvas.size.height}
              min={Consts.minCanvasHeight}
              max={Consts.maxCanvasHeight}
              onInput={() => {
                updateButtonState();
                updateCurrentPreset();
              }}
              required
            />
          </div>
          <button
            class={canvasSizeButtonStyle}
            onClick={(e) => {
              e.preventDefault();
              submitSizeChange();
            }}
            disabled={!isChangable()}
            style={{
              color: isChangable() ? 'var(--color-active)' : undefined,
              'border-color': isChangable() ? 'var(--color-active)' : undefined,
            }}
          >
            apply
          </button>
        </div>
        {/* <div class={defaultButtonContainerStyle}>
          <Button
            onClick={async () => {
              setGlobalConfig('default', 'canvasSize', projectStore.canvas.canvas);
              await saveGlobalSettings(true);
            }}
          >
            Set as Default.
          </Button>
          <p class={defaultInfoStyle}>current: {`${globalConfig.default.canvasSize.width} x ${globalConfig.default.canvasSize.height}`}</p>
        </div> */}
        <div class={actionsContainer}>
          <Button onClick={() => centeringCanvas()}>Center Canvas.</Button>

          <Button onClick={() => adjustZoomToFit()} class={adjustZoomButtonStyle}>
            Adjust zoom.
          </Button>
        </div>
      </div>
    </SectionItem>
  );
};

export default CanvasSettings;
