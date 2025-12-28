import { Component, JSXElement } from 'solid-js';
import { sectionSubCaption, sectionSubContent } from '~/components/section/SectionStyles';

interface EffectControlProps {
  label: string;
  children?: JSXElement;
}

export const EffectControl: Component<EffectControlProps> = (props) => {
  return (
    <div>
      <p class={sectionSubCaption}>{props.label}</p>
      <div class={sectionSubContent}>{props.children}</div>
    </div>
  );
};
