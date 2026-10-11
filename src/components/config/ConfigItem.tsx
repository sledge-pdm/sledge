import { Icon } from '@sledge-pdm/ui';
import { Component, JSXElement, Show } from 'solid-js';
import {
  configFormFieldControlWrapper,
  configFormFieldItem,
  configFormFieldLabel,
  configFormFieldLabelTooltip,
} from '~/components/config/ConfigStyles';
import { flexRow } from '~/styles/styles';

interface Props {
  label: string;
  tips?: string;
  children?: JSXElement;
}

const ConfigItem: Component<Props> = (props) => {
  return (
    <div class={configFormFieldItem}>
      <div class={flexRow}>
        <Icon src={'/assets/icons/misc/bullet_s_8.png'} base={8} />
        <p class={configFormFieldLabel}>{props.label.toUpperCase()}</p>
        <Show when={props.tips !== undefined}>
          <p class={configFormFieldLabelTooltip} title={props.tips}>
            ?
          </p>
        </Show>
      </div>
      <div class={configFormFieldControlWrapper}>{props.children}</div>
    </div>
  );
};

export default ConfigItem;
