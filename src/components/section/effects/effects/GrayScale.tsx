import { GrayscaleEffect } from '@sledge-pdm/frasco';
import { Component } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

const GrayScale: Component<EffectSectionProps> = (props) => {
  return (
    <EffectWrapper
      title='grayscale.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'grayscale', (layer) => GrayscaleEffect.apply(layer, { context: { tool: 'fx', fxName: 'grayscale' } }));
      }}
    ></EffectWrapper>
  );
};

export default GrayScale;
