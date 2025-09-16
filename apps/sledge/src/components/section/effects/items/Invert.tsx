import { flexCol } from '@sledge/core';
import { accentedButton } from '@sledge/theme';
import { invert } from '@sledge/wasm';
import { Component } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import SectionItem from '~/components/section/SectionItem';
import { getAgentOf } from '~/features/layer/agent/LayerAgentManager';
import { canvasStore } from '~/stores/ProjectStores';
import { sectionContent } from '~/styles/section/section_item.css';

const Invert: Component<EffectSectionProps> = (props) => {
  return (
    <SectionItem title='invert.'>
      <div class={sectionContent} style={{ gap: '4px', 'margin-bottom': '8px' }}>
        <div
          class={flexCol}
          style={{
            width: '100%',
            'align-items': 'end',
          }}
        >
          <button
            class={accentedButton}
            onClick={() => {
              const agent = getAgentOf(props.selectedLayerId());
              if (agent) {
                const originalBuffer = new Uint8ClampedArray(agent.getBuffer());
                invert(agent.getNonClampedBuffer(), canvasStore.canvas.width, canvasStore.canvas.height);
                agent.forceUpdate();

                agent.getDiffManager().setWhole(originalBuffer, agent.getBuffer());
                agent.registerToHistory({ tool: 'fx', fxName: 'Invert' });
              }
            }}
          >
            Apply.
          </button>
        </div>
      </div>
    </SectionItem>
  );
};

export default Invert;
