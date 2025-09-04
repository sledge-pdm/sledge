import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { heroHeading, subHeading } from '~/styles/page.css';
import { sectionContainer, sectionImage } from '~/styles/telling_section.css';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 2: CHAOS ENGINE. */
const ChaosEngineSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={2}>
      <div class={sectionContainer}>
        <p class={heroHeading}>CHAOS ENGINE.</p>
        <p class={subHeading}>Play with noise, patterns, and randomized tools to stir creative chaos—then tame it.</p>
        <img class={sectionImage} src={'/images/chaos_pseudo_0903.png'} />
      </div>
    </TellingSection>
  );
};

export default ChaosEngineSection;
