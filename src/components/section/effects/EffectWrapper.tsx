import { css } from '@acab/ecsstatic';
import { Component, JSXElement } from 'solid-js';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { accentedButton } from '~/styles/styles';

const applyButtonContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: end;
  margin-top: 8px;
`;

interface EffectWrapperProps {
  title: string;
  onApply: () => void;
  applyButtonLabel?: string; // デフォルト "Apply."
  children?: JSXElement;
  gap?: string; // デフォルト "4px"
}

export const EffectWrapper: Component<EffectWrapperProps> = (props) => {
  return (
    <SectionItem title={props.title} expandable defaultExpanded>
      <div class={sectionContent} style={{ gap: props.gap ?? '4px' }}>
        {props.children}

        <div class={applyButtonContainer}>
          <button
            class={accentedButton}
            onClick={() => {
              props.onApply?.();
            }}
          >
            {props.applyButtonLabel ?? 'Apply.'}
          </button>
        </div>
      </div>
    </SectionItem>
  );
};
