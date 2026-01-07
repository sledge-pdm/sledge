import { Component } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';
import { GrayscaleEffect } from '@sledge-pdm/frasco';

const GrayScale: Component<EffectSectionProps> = (props) => {
  return (
    <EffectWrapper
      title='grayscale.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'grayscale', (layer) => GrayscaleEffect.apply(layer));
      }}
    ></EffectWrapper>
  );
};

export default GrayScale;
