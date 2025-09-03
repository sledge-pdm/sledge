import { vars } from '@sledge/theme';
import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { globalStore } from '~/store/GlobalStore';
import { heroHeading, leftCol, rightCol, subHeading } from '~/styles/telling_section.css';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 2: CHAOS ENGINE. */
const ChaosEngineSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={2}>
      <div
        class={leftCol}
        style={{
          padding: '7rem 5rem',
          gap: '4rem',
        }}
      >
        <p class={heroHeading}>CHAOS ENGINE.</p>
        <p class={subHeading}>Play with noise, patterns, and randomized tools to stir creative chaos—then tame it.</p>
      </div>
      <div
        class={rightCol}
        style={{
          visibility: globalStore.currentTellingPage === 2 ? 'visible' : 'collapse',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '50vh',
            background: `repeating-conic-gradient(from 0deg, ${vars.color.accent}22 0% 10%, transparent 10% 20%)`,
            border: `1px dashed ${vars.color.accent}`,
            'border-radius': '8px',
          }}
        />
      </div>
    </TellingSection>
  );
};

export default ChaosEngineSection;
