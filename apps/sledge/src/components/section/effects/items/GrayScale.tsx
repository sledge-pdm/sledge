import { flexCol } from '@sledge/core';
import { accentedButton } from '@sledge/theme';
import { Component } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import SectionItem from '~/components/section/SectionItem';
import { applyEffect } from '~/features/effect/Effects';
import { sectionContent } from '../../SectionStyles';

const GrayScale: Component<EffectSectionProps> = (props) => {
  return (
    <SectionItem title='grayscale.'>
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
