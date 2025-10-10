import { css } from '@acab/ecsstatic';
import { Component, createEffect, createSignal } from 'solid-js';
import { adjustZoomToFit, centeringCanvas, changeCanvasSizeWithNoOffset, setRotation } from '~/features/canvas';
import { canvasStore } from '~/stores/ProjectStores';

import { Button, Dropdown } from '@sledge/ui';
import SectionItem from '~/components/section/SectionItem';
import { Consts } from '~/Consts';
import { canvasSizePresets, canvasSizePresetsDropdownOptions } from '~/features/canvas';
import { saveGlobalSettings } from '~/features/io/config/save';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { sectionContent, sectionSubCaption, sectionSubContent } from '../SectionStyles';

const canvasContentStyle = css`
  gap: 10px;
  padding-bottom: 24px;
`;

const sizeRowStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const frameModeButtonContainerStyle = css`
  display: flex;
  flex-direction: column;
  margin-left: auto;
  gap: 6px;
`;

const presetRowStyle = css`
  display: flex;
  align-items: center;
  margin-bottom: 2px;
`;

const presetLabelStyle = css`
  color: var(--color-on-background);
  width: 72px;
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
  gap: 6px;
`;

const defaultInfoStyle = css`
  font-family: ZFB03B;
  font-size: 8px;
  margin-left: 4px;
  opacity: 0.5;
`;

const actionsSectionStyle = css`
  margin-top: 12px;
  margin-bottom: 4px;
`;

const adjustZoomButtonStyle = css`
  margin-top: 8px;
`;

const CanvasSettings: Component = () => {
  let widthInputRef: HTMLInputElement;
  let heightInputRef: HTMLInputElement;

  const submitSizeChange = async () => {
    const width = Number(widthInputRef.value);
    const height = Number(heightInputRef.value);
    const newSize = { width, height };

    const result = await changeCanvasSizeWithNoOffset(newSize, false);
    if (result) adjustZoomToFit();
  };

  const [isChangable, setIsChangable] = createSignal(false);
  const [sizePreset, setSizePreset] = createSignal<string>('undefined');

  createEffect(() => {
    canvasStore.canvas;

    console.log('CanvasSettings: canvas changed', canvasStore.canvas);
    updateButtonState();
    updateCurrentPreset();
  });

  const updateButtonState = () => {
    if (!widthInputRef || !heightInputRef) {
      setIsChangable(false);
      return;
    }
    const changable = Number(widthInputRef.value) !== canvasStore.canvas.width || Number(heightInputRef.value) !== canvasStore.canvas.height;
    setIsChangable(changable);
  };

  const updateCurrentPreset = () => {
    const cw = widthInputRef ? Number(widthInputRef.value) : canvasStore.canvas.width;
    const ch = heightInputRef ? Number(heightInputRef.value) : canvasStore.canvas.height;
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
      const canvas = canvasStore.canvas;
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
        <div class={sizeRowStyle}>
          <p class={sectionSubCaption}>size.</p>
          <div class={frameModeButtonContainerStyle}>
            <Button
              onClick={async () => {
                setInteractStore('isCanvasSizeFrameMode', (v) => !v);
              }}
              style={{
                color: interactStore.isCanvasSizeFrameMode ? 'var(--color-error)' : 'var(--color-accent)',
                'border-color': interactStore.isCanvasSizeFrameMode ? 'var(--color-error)' : 'var(--color-accent)',
              }}
            >
              {interactStore.isCanvasSizeFrameMode ? 'QUIT FRAME MODE.' : 'RESIZE WITH FRAME.'}
            </Button>
          </div>
        </div>
        <div class={sectionSubContent}>
          <div class={presetRowStyle}>
            <p class={presetLabelStyle}>presets.</p>
            <Dropdown options={canvasSizePresetsDropdownOptions} value={sizePreset} onChange={handlePresetChange} wheelSpin={false} />
          </div>
          <div class={canvasSizeFormStyle}>
            <div>
              <p class={canvasSizeLabelStyle}>width</p>
              <input
                ref={(el) => (widthInputRef = el)}
                class={canvasSizeInputStyle}
                type='number'
                name='width'
                value={canvasStore.canvas.width}
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
                value={canvasStore.canvas.height}
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
        </div>
        <div class={defaultButtonContainerStyle}>
          <Button
            onClick={async () => {
              setGlobalConfig('default', 'canvasSize', canvasStore.canvas);
              await saveGlobalSettings(true);
            }}
          >
            Set as Default.
          </Button>
          <p class={defaultInfoStyle}>[ current: {`${globalConfig.default.canvasSize.width} x ${globalConfig.default.canvasSize.height}`} ]</p>
        </div>
        {/* <p class={sectionSubCaption} style={{ 'margin-top': '4px', 'margin-bottom': '4px' }}>
          info.
        </p>
        <div class={flexCol} style={{ gap: '4px', overflow: 'hidden' }}>
          <div class={flexRow}>
            <p style={{ 'font-family': ZFB03, width: '50px', 'font-size': '8px', opacity: 0.75 }}>size</p>
            <p style={{ 'white-space': 'wrap' }}>{`${canvasStore.canvas.width} x ${canvasStore.canvas.height}`}</p>
          </div>
          <div class={flexRow}>
            <p style={{ 'font-family': ZFB03, width: '50px', 'font-size': '8px', opacity: 0.75 }}>layers</p>
            <p style={{ 'white-space': 'wrap' }}>{`${allLayers().length}`}</p>
          </div>
          <div class={flexRow}>
            <p style={{ 'font-family': ZFB03, width: '50px', 'font-size': '8px', opacity: 0.75 }}>active</p>
            <p style={{ 'white-space': 'wrap' }}>{`${activeLayer().name}`}</p>
          </div>
        </div> */}
        <p class={`${sectionSubCaption} ${actionsSectionStyle}`}>actions.</p>
        <div class={sectionSubContent}>
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
