import { Component, createSignal } from 'solid-js';
import { adjustZoomToFit } from '~/controllers/canvas/CanvasController';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { canvasStore, layerListStore, setCanvasStore } from '~/stores/ProjectStores';

import { canvasSizeButton, canvasSizeForm, canvasSizeInput, canvasSizeLabel } from '~/styles/section/canvas.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section_global.css';
import { Consts } from '~/utils/consts';

const CanvasSettings: Component = () => {
  const [width, setWidth] = createSignal(canvasStore.canvas.width);
  const [height, setHeight] = createSignal(canvasStore.canvas.height);

  const changeCanvasSize = (e: any) => {
    e.preventDefault();
    setCanvasStore('canvas', 'width', width());
    setCanvasStore('canvas', 'height', height());

    changeCanvasSize({ width: width(), height: height() });

    console.log(`canvas size changed. ${width()} x ${height}`);

    adjustZoomToFit(width(), height());
  };

  const resetAllLayers = (e: any) => {
    layerListStore.layers.forEach((l) => {
      resetLayerImage(l.id, l.dotMagnification);
    });
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>canvas.</p>

      <form
        class={sectionContent}
        onSubmit={(e) => {
          changeCanvasSize(e);
        }}
      >
        <div class={canvasSizeForm}>
          <div>
            <p class={canvasSizeLabel}>width</p>
            <input
              class={canvasSizeInput}
              type='number'
              name='width'
              onChange={(e) => setWidth(Number(e.target.value))}
              value={width()}
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
              onChange={(e) => setHeight(Number(e.target.value))}
              value={height()}
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
