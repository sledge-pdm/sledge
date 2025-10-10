import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import SectionItem from '~/components/section/SectionItem';
import { applyEffect } from '~/features/effect/Effects';
import { accentedButton } from '~/styles';
import { sectionContent } from '../../SectionStyles';

const applyButtonContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: end;
`;

const GrayScale: Component<EffectSectionProps> = (props) => {
  return (
    <SectionItem title='grayscale.'>
      <div class={sectionContent} style={{ gap: '4px', 'margin-bottom': '8px' }}>
        <div class={applyButtonContainer}>
          <button
            class={accentedButton}
            onClick={() => {
              applyEffect(props.selectedLayerId(), 'grayscale');
            }}
          >
            Apply.
          </button>
        </div>
      </div>
    </SectionItem>
  );
};

export default GrayScale;
