import { Component } from 'solid-js';
import { TellingSection } from '~/components/TellingSection';
import { heroHeading, sectionContainer, sectionImage, subHeading } from '~/styles/SharedStyles';

interface Props {
  attachPanelRef: (el: HTMLElement) => void;
}
/* Panel 1: HARD EDGED. */
const HardEdgedSection: Component<Props> = (props) => {
  return (
    <TellingSection pageNumber={1}>
      <div class={sectionContainer}>
        <p class={heroHeading}>HARD EDGED.</p>
        <p class={subHeading}>Pixel-perfect editing with destructive operations. Hard edges, sharp states, and immediate feedback.</p>

        <img class={sectionImage} src='/images/hard-edge-icon_0903.png' />
      </div>
    </TellingSection>
  );
};

export default HardEdgedSection;
