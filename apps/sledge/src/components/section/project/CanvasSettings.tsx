import { Component } from 'solid-js';
import { adjustZoomToFit, centeringCanvas, changeCanvasSize, isValidCanvasSize } from '~/controllers/canvas/CanvasController';
import { canvasStore } from '~/stores/ProjectStores';

import { flexCol, flexRow } from '@sledge/core';
import { ZFB03 } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { activeLayer, allLayers } from '~/controllers/layer/LayerListController';
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

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>canvas.</p>

      <div class={sectionContent} style={{ 'padding-left': '8px', gap: '6px', 'margin-bottom': '8px' }}>
        <div class={canvasSizeForm}>
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

      <div class={flexCol} style={{ gap: '4px', overflow: 'hidden' }}>
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

        <Button onClick={() => centeringCanvas()} style={{ 'margin-top': '8px' }}>
          Center Canvas.
        </Button>

        <Button onClick={() => adjustZoomToFit()} style={{ 'margin-top': '8px' }}>
          Adjust zoom to Fit.
        </Button>
      </div>
    </div>
  );
};

export default CanvasSettings;
