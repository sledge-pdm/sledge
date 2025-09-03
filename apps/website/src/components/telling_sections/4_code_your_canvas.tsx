import { vars } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { globalStore } from '~/store/GlobalStore';
import { mainButton, mainButtonContainer } from '~/styles/buttons.css';
import { heroHeading, leftCol, rightCol, subHeading } from '~/styles/telling_section.css';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 4: CODE YOUR CANVAS. */
const CodeYourCanvasSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={4}>
      <div
        class={leftCol}
        style={{
          padding: '7rem 5rem',
          gap: '4rem',
        }}
      >
        <p class={heroHeading}>CODE YOUR CANVAS.</p>
        <p class={subHeading}>Extend Sledge with WASM-powered tools and scripts. Your canvas, your rules.</p>
        <div class={mainButtonContainer}>
          <Button
            onClick={() => {
              window.open('https://github.com/Innsbluck-rh/sledge', '_blank')?.focus();
            }}
            hoverColor='white'
            class={mainButton}
          >
            VIEW CODE.
          </Button>
        </div>
      </div>
      <div
        class={rightCol}
        style={{
          visibility: globalStore.currentTellingPage === 4 ? 'visible' : 'collapse',
        }}
      >
        <div
          style={{
            width: '80%',
            height: '50vh',
            background: `linear-gradient(90deg, ${vars.color.accent}11 0%, ${vars.color.accent}44 50%, ${vars.color.accent}11 100%)`,
            border: `1px solid ${vars.color.accent}`,
            'border-radius': '8px',
          }}
        />
      </div>
    </TellingSection>
  );
};

export default CodeYourCanvasSection;
