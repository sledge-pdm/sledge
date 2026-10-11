import { InvertEffect } from '@sledge-pdm/frasco';
import { Component } from 'solid-js';
import { EffectItem } from '~/components/section/effects/EffectItem';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { applyEffect } from '~/features/effect/Effects';

const Invert: Component<EffectSectionProps> = (props) => {
  return (
    <EffectItem
      title='invert.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'invert', (layer) => InvertEffect.apply(layer, { context: { tool: 'fx', fxName: 'invert' } }));
      }}
    ></EffectItem>
  );
};

export default Invert;
