import { Component } from 'solid-js';
import { adjustZoomToFit, changeCanvasSize, isValidCanvasSize } from '~/controllers/canvas/CanvasController';
import { resetAllLayers } from '~/controllers/layer/LayerListController';
import { canvasStore } from '~/stores/ProjectStores';

import { Consts } from '~/models/Consts';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/globals/section_global.css';
import {
  canvasSizeButton,
  canvasSizeForm,
  canvasSizeInput,
  canvasSizeLabel,
  canvasSizeResetAllLayerButton,
  canvasSizeTimes,
} from '~/styles/section/canvas.css';

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

      <form class={sectionContent} onSubmit={(e) => e.preventDefault()}>
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
      </form>

      <button class={canvasSizeResetAllLayerButton} onClick={resetAllLayers}>
        RESET ALL LAYERS
      </button>
    </div>
  );
};

export default CanvasSettings;
