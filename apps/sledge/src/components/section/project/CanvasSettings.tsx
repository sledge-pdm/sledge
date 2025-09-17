import { Component, createEffect, createSignal } from 'solid-js';
import { adjustZoomToFit, centeringCanvas, changeCanvasSize, isValidCanvasSize } from '~/features/canvas';
import { canvasStore } from '~/stores/ProjectStores';

import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB03, ZFB03B } from '@sledge/theme';
import { Button, Dropdown } from '@sledge/ui';
import SectionItem from '~/components/section/SectionItem';
import { Consts } from '~/Consts';
import { canvasSizePresets, canvasSizePresetsDropdownOptions } from '~/features/canvas';
import { activeLayer, allLayers } from '~/features/layer';
import { saveGlobalSettings } from '~/io/config/save';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { canvasSizeButton, canvasSizeForm, canvasSizeInput, canvasSizeLabel, canvasSizeTimes } from '~/styles/section/project/canvas.css';
import { sectionCaption, sectionContent } from '~/styles/section/section_item.css';

const CanvasSettings: Component = () => {
  let widthInputRef: HTMLInputElement;
  let heightInputRef: HTMLInputElement;

  const submitSizeChange = async () => {
    const width = Number(widthInputRef.value);
    const height = Number(heightInputRef.value);
    const newSize = { width, height };

    if (isValidCanvasSize(newSize)) {
      const result = await changeCanvasSize(newSize);
      if (result) adjustZoomToFit();
    }
  };

  const [isChangable, setIsChangable] = createSignal(false);
  const [sizePreset, setSizePreset] = createSignal<string>('undefined');

  createEffect(() => {
    canvasStore.canvas;
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

  return (
    <SectionItem title='canvas.'>
      <div class={sectionContent} style={{ gap: '10px', 'margin-top': '8px', 'padding-bottom': '24px' }}>
        <div class={flexRow}>
          <p class={sectionCaption}>size.</p>
          <div class={flexCol} style={{ 'margin-left': 'auto', gap: '6px' }}>
            <Button
              onClick={async () => {
                setInteractStore('isCanvasSizeFrameMode', (v) => !v);
              }}
              style={{
                color: interactStore.isCanvasSizeFrameMode ? vars.color.error : vars.color.accent,
                'border-color': interactStore.isCanvasSizeFrameMode ? vars.color.error : vars.color.accent,
              }}
            >
              {interactStore.isCanvasSizeFrameMode ? 'QUIT FRAME MODE.' : 'RESIZE WITH FRAME.'}
            </Button>
          </div>
        </div>
        <div class={flexRow} style={{ 'align-items': 'center', 'margin-bottom': '2px' }}>
          <p style={{ color: vars.color.onBackground, width: '72px' }}>presets.</p>
          <Dropdown options={canvasSizePresetsDropdownOptions} value={sizePreset} onChange={handlePresetChange} wheelSpin={false} />
        </div>
        <div class={canvasSizeForm} style={{ 'margin-bottom': '2px' }}>
          <div>
            <p class={canvasSizeLabel}>width</p>
            <input
              ref={(el) => (widthInputRef = el)}
              class={canvasSizeInput}
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

          <p class={canvasSizeTimes}>x</p>

          <div>
            <p class={canvasSizeLabel}>height</p>
            <input
              ref={(el) => (heightInputRef = el)}
              class={canvasSizeInput}
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
            class={canvasSizeButton}
            onClick={(e) => {
              e.preventDefault();
              submitSizeChange();
            }}
            disabled={!isChangable()}
            style={{
              'margin-left': 'auto',
              color: isChangable() ? vars.color.active : undefined,
              'border-color': isChangable() ? vars.color.active : undefined,
            }}
          >
            apply
          </button>
        </div>
        <div class={flexCol} style={{ gap: '6px' }}>
          <Button
            onClick={async () => {
              setGlobalConfig('default', 'canvasSize', canvasStore.canvas);
              await saveGlobalSettings(true);
            }}
            style={{ 'margin-top': '8px' }}
          >
            Set current size as Default.
          </Button>
          <p style={{ 'font-family': ZFB03B, 'font-size': '8px', 'margin-left': '4px', opacity: 0.5 }}>
            [ current: {`${globalConfig.default.canvasSize.width} x ${globalConfig.default.canvasSize.height}`} ]
          </p>
        </div>
        <p class={sectionCaption} style={{ 'margin-top': '12px', 'margin-bottom': '4px' }}>
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
        </div>
        <p class={sectionCaption} style={{ 'margin-top': '12px', 'margin-bottom': '4px' }}>
          actions.
        </p>
        <div class={flexCol} style={{ gap: '4px', overflow: 'hidden' }}>
          <Button onClick={() => centeringCanvas()}>Center Canvas.</Button>

          <Button onClick={() => adjustZoomToFit()} style={{ 'margin-top': '8px' }}>
            Adjust zoom.
          </Button>
        </div>
      </div>
    </SectionItem>
  );
};

export default CanvasSettings;
