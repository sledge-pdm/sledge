import { css } from '@acab/ecsstatic';
import { FoldBox } from '@sledge-pdm/ui';
import { Component, JSXElement } from 'solid-js';
import { accentedButton } from '~/styles/styles';

const content = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
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
  applyButtonLabel?: string;
  children?: JSXElement;
}

export const EffectItem: Component<EffectWrapperProps> = (props) => {
  return (
    <FoldBox title={props.title}>
      <div class={content}>
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
    </FoldBox>
  );
};
