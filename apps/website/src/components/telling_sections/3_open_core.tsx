import { vars } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { globalStore } from '~/store/GlobalStore';
import { mainButton } from '~/styles/buttons.css';
import { heroHeading, leftCol, rightCol, subHeading } from '~/styles/telling_section.css';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 3: OPEN CORE. */
const OpenCoreSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={3}>
      <div
        class={leftCol}
        style={{
          padding: '7rem 5rem',
          gap: '4rem',
        }}
      >
        <p class={heroHeading}>OPEN CORE.</p>
        <p class={subHeading}>MIT-licensed core with a transparent roadmap, tests, and a welcoming PR flow.</p>

        <Button class={mainButton}>Visit GITHUB</Button>
      </div>
      <div
        class={rightCol}
        style={{
          visibility: globalStore.currentTellingPage === 3 ? 'visible' : 'collapse',
        }}
      >
        <img
          src='/images/github_0903.png'
          style={{
            width: '100%',
            height: 'auto',
            border: `1px solid ${vars.color.muted}`,
            'border-radius': '8px',
            'place-items': 'center',
          }}
        >
          open-core docs & api preview
        </img>
      </div>
    </TellingSection>
  );
};

export default OpenCoreSection;
