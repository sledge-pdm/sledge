import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { heroHeading, mainLink, sectionContainer, sectionImage, subHeading } from '~/styles/SharedStyles';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 3: OPEN CORE. */
const OpenCoreSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={3}>
      <div class={sectionContainer}>
        <p class={heroHeading}>OPEN CORE.</p>
        <p class={subHeading}>MIT-licensed core with a transparent roadmap, tests, and a welcoming PR flow.</p>

        <a
          onClick={() => {
            window.open('https://github.com/sledge-pdm/sledge', '_blank')?.focus();
          }}
          class={mainLink}
          style={{ 'text-align': 'end', 'margin-bottom': '1rem' }}
        >
          &gt; Visit GITHUB.
        </a>
        <img class={sectionImage} src='/images/github_0903.png'>
          open-core docs & api preview
        </img>
      </div>
    </TellingSection>
  );
};

export default OpenCoreSection;
