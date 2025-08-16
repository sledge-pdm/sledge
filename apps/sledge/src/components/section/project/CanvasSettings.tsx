import { Component, createEffect, createSignal } from 'solid-js';
import { adjustZoomToFit, centeringCanvas, changeCanvasSize, isValidCanvasSize } from '~/controllers/canvas/CanvasController';
import { canvasStore } from '~/stores/ProjectStores';

import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB03 } from '@sledge/theme';
import { Button, Dropdown } from '@sledge/ui';
import { activeLayer, allLayers } from '~/controllers/layer/LayerListController';
import { canvasSizePresets, canvasSizePresetsDropdownOptions } from '~/models/canvas/Canvas';
import { Consts } from '~/models/Consts';
import { canvasSizeButton, canvasSizeForm, canvasSizeInput, canvasSizeLabel, canvasSizeTimes } from '~/styles/section/project/canvas.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section_item.css';

const CanvasSettings: Component = () => {
  let widthInputRef: HTMLInputElement;
  let heightInputRef: HTMLInputElement;

  const submitSizeChange = () => {
    const width = Number(widthInputRef.value);
    const height = Number(heightInputRef.value);
    const newSize = { width, height };

    if (isValidCanvasSize(newSize)) {
      changeCanvasSize(newSize);
      adjustZoomToFit();
    }
  };

  const [sizePreset, setSizePreset] = createSignal<string>('undefined');

  createEffect(() => {
    canvasStore.canvas;
    updateCurrentPreset();
  });

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
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>canvas.</p>

      <div class={sectionContent} style={{ 'padding-left': '8px', gap: '12px', 'margin-top': '8px', 'margin-bottom': '24px' }}>
        <div class={flexRow} style={{ 'align-items': 'center', gap: '12px', 'margin-bottom': '2px' }}>
          <p style={{ color: vars.color.muted }}>presets</p>
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
              onInput={() => updateCurrentPreset()}
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
              onInput={() => updateCurrentPreset()}
              required
            />
          </div>
          <button
            class={canvasSizeButton}
            onClick={(e) => {
              e.preventDefault();
              submitSizeChange();
            }}
          >
            change
          </button>
        </div>
      </div>

      <div class={flexCol} style={{ 'padding-left': '8px', gap: '4px', overflow: 'hidden' }}>
        <div class={flexRow}>
          <p style={{ 'font-family': ZFB03, width: '50px', 'font-size': '8px' }}>size</p>
          <p style={{ 'white-space': 'wrap' }}>{`${canvasStore.canvas.width} x ${canvasStore.canvas.height}`}</p>
        </div>
        <div class={flexRow}>
          <p style={{ 'font-family': ZFB03, width: '50px', 'font-size': '8px' }}>layers</p>
          <p style={{ 'white-space': 'wrap' }}>{`${allLayers().length}`}</p>
        </div>
        <div class={flexRow}>
          <p style={{ 'font-family': ZFB03, width: '50px', 'font-size': '8px' }}>active</p>
          <p style={{ 'white-space': 'wrap' }}>{`${activeLayer().name}`}</p>
        </div>

        <Button onClick={() => centeringCanvas()} style={{ 'margin-top': '12px' }}>
          Center Canvas.
        </Button>

        <Button onClick={() => adjustZoomToFit()} style={{ 'margin-top': '8px' }}>
          Adjust zoom.
        </Button>
      </div>
    </div>
  );
};

export default CanvasSettings;
