import { Component, createEffect, createSignal } from 'solid-js';
import { adjustZoomToFit, centeringCanvas, changeCanvasSize, isValidCanvasSize } from '~/controllers/canvas/CanvasController';
import { canvasStore } from '~/stores/ProjectStores';

import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB03 } from '@sledge/theme';
import { Button, Dropdown } from '@sledge/ui';
import SectionItem from '~/components/section/SectionItem';
import { activeLayer, allLayers } from '~/controllers/layer/LayerListController';
import { canvasSizePresets, canvasSizePresetsDropdownOptions } from '~/models/canvas/Canvas';
import { Consts } from '~/models/Consts';
import { canvasSizeButton, canvasSizeForm, canvasSizeInput, canvasSizeLabel, canvasSizeTimes } from '~/styles/section/project/canvas.css';
import { sectionContent } from '~/styles/section/section_item.css';

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
      <div class={sectionContent} style={{ gap: '10px', 'margin-top': '2px', 'margin-bottom': '24px' }}>
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
              opacity: isChangable() ? 1 : 0.2,
              'pointer-events': isChangable() ? 'auto' : 'none',
              color: isChangable() ? vars.color.active : undefined,
              'border-color': isChangable() ? vars.color.active : undefined,
            }}
          >
            apply
          </button>
        </div>
        <div class={flexCol} style={{ 'margin-top': '8px', gap: '4px', overflow: 'hidden' }}>
          <p style={{ 'font-family': ZFB03, width: '100%', 'font-size': '8px', 'margin-bottom': '6px' }}>{'canvas info'}</p>
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

          <Button onClick={() => centeringCanvas()} style={{ 'margin-top': '12px' }}>
            Center Canvas.
          </Button>

          <Button onClick={() => adjustZoomToFit()} style={{ 'margin-top': '8px' }}>
            Adjust zoom.
          </Button>
        </div>
      </div>
    </SectionItem>
  );
};

export default CanvasSettings;
