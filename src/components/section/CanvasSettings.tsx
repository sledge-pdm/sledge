import { Component } from 'solid-js';
import { adjustZoomToFit, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { resetAllLayers } from '~/controllers/layer/LayerController';
import { canvasStore } from '~/stores/ProjectStores';

import { sectionCaption, sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';
import { canvasSizeButton, canvasSizeForm, canvasSizeInput, canvasSizeLabel } from '~/styles/section/canvas.css';
import { Consts } from '~/utils/consts';

const CanvasSettings: Component = () => {
  const onSizeChange = (type: 'width' | 'height', value: number) => {
    if (type === 'width') {
      changeCanvasSize({ width: value, height: canvasStore.canvas.height });
    } else {
      changeCanvasSize({ width: canvasStore.canvas.width, height: value });
    }

    adjustZoomToFit();
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>canvas.</p>

      <form class={sectionContent} onSubmit={(e) => e.preventDefault()}>
        <div class={canvasSizeForm}>
          <div>
            <p class={canvasSizeLabel}>width</p>
            <input
              class={canvasSizeInput}
              type='number'
              name='width'
              value={canvasStore.canvas.width}
              min={Consts.minCanvasWidth}
              max={Consts.maxCanvasWidth}
              required
            />
          </div>
          <div>
            <p class={canvasSizeLabel}>height</p>
            <input
              class={canvasSizeInput}
              type='number'
              name='height'
              value={canvasStore.canvas.height}
              min={Consts.minCanvasHeight}
              max={Consts.maxCanvasHeight}
              required
            />
          </div>
          <button class={canvasSizeButton} type='submit'>
            change
          </button>
        </div>
      </form>

      <button class={canvasSizeButton} onClick={resetAllLayers}>
        RESET ALL LAYERS
      </button>
    </div>
  );
};

export default CanvasSettings;
