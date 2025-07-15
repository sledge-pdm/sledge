import { flexCol } from '@sledge/core';
import { gaussian_blur, grayscale } from '@sledge/wasm';
import { Component } from 'solid-js';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { canvasStore } from '~/stores/ProjectStores';
import { sectionCaption, sectionRoot } from '~/styles/section/section.css';

const Effects: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>effects.</p>

      <div class={flexCol} style={{ gap: '8px' }}>
        <button
          onClick={() => {
            const agent = getActiveAgent();
            if (agent) {
              const originalBuffer = new Uint8ClampedArray(agent.getBuffer());
              grayscale(agent.getNonClampedBuffer(), canvasStore.canvas.width, canvasStore.canvas.height);
              agent.forceUpdate();

              agent.getDiffManager().add({
                kind: 'whole',
                before: originalBuffer,
                after: agent.getBuffer(),
              });
              agent.registerToHistory();
            }
          }}
        >
          grayscale
        </button>

        <button
          onClick={() => {
            const agent = getActiveAgent();
            if (agent) {
              const originalBuffer = new Uint8ClampedArray(agent.getBuffer());
              gaussian_blur(agent.getNonClampedBuffer(), canvasStore.canvas.width, canvasStore.canvas.height, 1000);
              agent.forceUpdate();

              agent.getDiffManager().add({
                kind: 'whole',
                before: originalBuffer,
                after: agent.getBuffer(),
              });
              agent.registerToHistory();
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
