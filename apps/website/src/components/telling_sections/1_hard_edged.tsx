import { vars } from '@sledge/theme';
import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { globalStore } from '~/store/GlobalStore';
import { headingContainer, heroHeading, leftCol, rightCol, subHeading } from '~/styles/telling_section.css';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 1: HARD EDGED. */
const HardEdgedSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={1}>
      <div class={leftCol}>
        <div class={headingContainer}>
          <p class={heroHeading}>HARD EDGED.</p>
        </div>
        <p class={subHeading}>Pixel-perfect editing with destructive operations. Hard edges, sharp states, and immediate feedback.</p>
      </div>
      <div
        class={rightCol}
        style={{
          visibility: globalStore.currentTellingPage === 1 ? 'visible' : 'collapse',
        }}
      >
        {/* placeholder visual block */}
        <div
          style={{
            width: '60vh',
            height: '60vh',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            background: `linear-gradient(135deg, ${vars.color.accent}22 0%, ${vars.color.accent}55 100%)`,
            border: `1px solid ${vars.color.accent}`,
            'background-color': 'red',
            'z-index': 4,
            'border-radius': '8px',
          }}
        >
          <p>canvas playground here.</p>
        </div>
      </div>
    </TellingSection>
  );
};

export default HardEdgedSection;
