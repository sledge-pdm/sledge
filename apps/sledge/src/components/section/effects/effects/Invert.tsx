import { Component } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

const Invert: Component<EffectSectionProps> = (props) => {
  return (
    <EffectWrapper
      title='invert.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'invert');
      }}
    ></EffectWrapper>
  );
};

export default Invert;
