import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { heroHeading, sectionContainer, sectionImage, subHeading } from '~/styles';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 4: CODE YOUR CANVAS. */
const CodeYourCanvasSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={4}>
      <div class={sectionContainer}>
        <p class={heroHeading}>CODE YOUR CANVAS.</p>
        <p class={subHeading}>Extend Sledge with WASM-powered tools and scripts. Your canvas, your rules.</p>
        {/* <a
          onClick={() => {
            window.open('https://github.com/sledge-pdm/sledge', '_blank')?.focus();
          }}
          class={mainLink}
          style={{ 'text-align': 'end', 'margin-bottom': '1rem' }}
        >
          &gt; VIEW CODE.
        </a> */}

        <img class={sectionImage} src='/images/history_tab_0903.png'>
          open-core docs & api preview
        </img>
      </div>
    </TellingSection>
  );
};

export default CodeYourCanvasSection;
