import { Component } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

const GrayScale: Component<EffectSectionProps> = (props) => {
  return (
    <EffectWrapper
      title='grayscale.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'grayscale', (buffer) => buffer.grayscale());
      }}
    ></EffectWrapper>
  );
};

export default GrayScale;
