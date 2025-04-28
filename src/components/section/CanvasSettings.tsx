import { Component } from 'solid-js';
import { adjustZoomToFit, changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { canvasStore, layerListStore, setCanvasStore } from '~/stores/ProjectStores';

import { canvasSizeButton, canvasSizeForm, canvasSizeInput, canvasSizeLabel } from '~/styles/section/canvas.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section_global.css';
import { Consts } from '~/utils/consts';

const CanvasSettings: Component = () => {
  const onSizeChange = (type: 'width' | 'height', value: number) => {
    if (type === 'width') {
      setCanvasStore('canvas', 'width', value);
      changeCanvasSize({ width: value, height: canvasStore.canvas.height });
    } else {
      setCanvasStore('canvas', 'height', value);
      changeCanvasSize({ width: canvasStore.canvas.width, height: value });
    }

    console.log(`canvas size changed. ${canvasStore.canvas.width} x ${canvasStore.canvas.height}`);

    adjustZoomToFit();
  };

  const resetAllLayers = (e: any) => {
    layerListStore.layers.forEach((l) => {
      resetLayerImage(l.id, l.dotMagnification);
    });
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>canvas.</p>

      <form class={sectionContent}>
        <div class={canvasSizeForm}>
          <div>
            <p class={canvasSizeLabel}>width</p>
            <input
              class={canvasSizeInput}
              type='number'
              name='width'
              onChange={(e) => onSizeChange('width', Number(e.target.value))}
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
              onChange={(e) => onSizeChange('height', Number(e.target.value))}
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
