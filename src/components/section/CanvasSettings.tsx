import { Component, createSignal } from 'solid-js';
import initLayerImage from '~/models/factories/initLayerImage';
import {
  adjustZoomToFit,
  canvasStore,
  setCanvasStore,
} from '~/stores/project/canvasStore';
import { allLayers, layerStore } from '~/stores/project/layerStore';

import {
  canvasSizeButton,
  canvasSizeForm,
  canvasSizeInput,
  canvasSizeLabel,
} from '~/styles/section/canvas.css';
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from '~/styles/section_global.css';

const CanvasSettings: Component = () => {
  const [width, setWidth] = createSignal(canvasStore.canvas.width);
  const [height, setHeight] = createSignal(canvasStore.canvas.height);

  const changeCanvasSize = (e: any) => {
    e.preventDefault();
    setCanvasStore('canvas', 'width', width());
    setCanvasStore('canvas', 'height', height());

    allLayers().forEach((layer, i) => {
      initLayerImage(layer.id, layer.dotMagnification);
    });

    console.log(`canvas size changed. ${width()} x ${height}`);

    adjustZoomToFit(width(), height());
  };

  const resetAllLayers = (e: any) => {
    layerStore.layers.forEach((l) => {
      initLayerImage(l.id, l.dotMagnification);
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
              min={0}
              max={10000}
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
              min={0}
              max={10000}
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
