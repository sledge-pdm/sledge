import { flexCol } from '@sledge/core';
import { Slider, ToggleSwitch } from '@sledge/ui';
import { AlphaBlurMode, gaussian_blur, GaussianBlurOption, grayscale } from '@sledge/wasm';
import { sectionCaption, sectionRoot } from '@styles/section/section_item.css';
import { Component, createSignal } from 'solid-js';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { canvasStore } from '~/stores/ProjectStores';

const Effects: Component = () => {
  const [blurOptions, setBlurOptions] = createSignal<GaussianBlurOption>(new GaussianBlurOption(1000, AlphaBlurMode.Blur));
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>effects.</p>

      <div class={flexCol} style={{ 'margin-top': '16px', gap: '16px' }}>
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
        <div>
          <button
            onClick={() => {
              const agent = getActiveAgent();
              if (agent) {
                const originalBuffer = new Uint8ClampedArray(agent.getBuffer());
                gaussian_blur(agent.getNonClampedBuffer(), canvasStore.canvas.width, canvasStore.canvas.height, blurOptions());
                agent.forceUpdate();

                agent.getDiffManager().add({
                  kind: 'whole',
                  before: originalBuffer,
                  after: agent.getBuffer(),
                });
                agent.registerToHistory();
              }
            }}
            style={{ 'margin-bottom': '8px' }}
          >
            gaussian blur
          </button>

          <div class={flexCol} style={{ gap: '8px', 'margin-bottom': '8px', 'margin-left': '16px' }}>
            <p>radius.</p>
            <div style={{ 'margin-left': '16px' }}>
              <Slider
                labelMode='left'
                value={blurOptions().radius}
                min={0}
                max={1000}
                allowFloat={false}
                onChange={(value) => {
                  setBlurOptions((prev) => new GaussianBlurOption(value, prev.alpha_mode));
                }}
              />
            </div>
          </div>

          <div class={flexCol} style={{ gap: '2px', 'margin-left': '16px' }}>
            <p>alpha erosion.</p>
            <div style={{ 'margin-left': '16px' }}>
              <ToggleSwitch
                checked={blurOptions().alpha_mode === AlphaBlurMode.Blur}
                onChange={(value) => {
                  setBlurOptions((prev) => new GaussianBlurOption(prev.radius, value ? AlphaBlurMode.Blur : AlphaBlurMode.Skip));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Effects;
