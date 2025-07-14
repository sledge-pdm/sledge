import { flexCol } from '@sledge/core';
import { apply_gaussian_blur, convert_to_grayscale } from '@sledge/wasm';
import { Component } from 'solid-js';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { canvasStore } from '~/stores/ProjectStores';
import { sectionCaption, sectionRoot } from '~/styles/section/section.css';
import { eventBus } from '~/utils/EventBus';

const Effects: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>effects.</p>

      <div class={flexCol} style={{ gap: '8px' }}>
        <button
          onClick={() => {
            const agent = getActiveAgent();
            if (agent) {
              const imageBuffer = agent.getNonClampedBuffer();
              convert_to_grayscale(imageBuffer, canvasStore.canvas.width, canvasStore.canvas.height);
              eventBus.emit('webgl:requestUpdate', { onlyDirty: false });
              eventBus.emit('preview:requestUpdate', { layerId: agent.layerId });
              agent.getTileManager().setAllDirty();
              agent.getTileManager().scanAllTilesUniformity();
            }
          }}
        >
          grayscale
        </button>

        <button
          onClick={() => {
            const agent = getActiveAgent();
            if (agent) {
              const imageBuffer = agent.getNonClampedBuffer();
              apply_gaussian_blur(imageBuffer, canvasStore.canvas.width, canvasStore.canvas.height, 1000);
              eventBus.emit('webgl:requestUpdate', { onlyDirty: false });
              eventBus.emit('preview:requestUpdate', { layerId: agent.layerId });
              agent.getTileManager().setAllDirty();
              agent.getTileManager().scanAllTilesUniformity();
            }
          }}
        >
          gaussian blur
        </button>
      </div>
    </div>
  );
};

export default Effects;
