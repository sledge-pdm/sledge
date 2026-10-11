import { GrayscaleEffect } from '@sledge-pdm/frasco';
import { Component } from 'solid-js';
import { EffectItem } from '~/components/section/effects/EffectItem';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { applyEffect } from '~/features/effect/Effects';

const GrayScale: Component<EffectSectionProps> = (props) => {
  return (
    <EffectItem
      title='grayscale.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'grayscale', (layer) => GrayscaleEffect.apply(layer, { context: { tool: 'fx', fxName: 'grayscale' } }));
      }}
    ></EffectItem>
  );
};

export default GrayScale;
