import { vars } from '@sledge/theme';
import { Component, For } from 'solid-js';
import { SectionTab } from '~/components/section/SectionTabs';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';

import {
  sideSectionControlItem,
  sideSectionControlRoot,
  sideSectionControlText,
  sideSectionControlTextActive,
  sideSectionControlToggle,
} from '~/styles/section/side_section_control.css';

interface ItemProps {
  side: 'leftSide' | 'rightSide';
  tab: SectionTab;
  index: number;
}
const ControlItem: Component<ItemProps> = (props) => {
  const selected = () => appearanceStore[props.side].selectedIndex === props.index && appearanceStore[props.side].shown;
  return (
    <div
      class={sideSectionControlItem}
      style={{ 'margin-top': props.tab === 'perilous' ? 'auto' : undefined, 'margin-bottom': props.tab === 'perilous' ? '16px' : undefined }}
    >
      <a
        class={selected() ? sideSectionControlTextActive : sideSectionControlText}
        style={{ color: props.tab === 'perilous' ? (selected() ? '#FF0000' : '#FF000090') : undefined }}
        onClick={() => {
          if (!appearanceStore[props.side].shown) {
            setAppearanceStore(props.side, 'shown', true);
          } else {
            if (selected()) {
              setAppearanceStore(props.side, 'shown', !appearanceStore[props.side].shown);
            } else {
              setAppearanceStore(props.side, 'shown', true);
            }
          }
          setAppearanceStore(props.side, 'selectedIndex', props.index);
        }}
      >
        {props.tab}.
      </a>
    </div>
  );
};

interface Props {
  side: 'leftSide' | 'rightSide';
}
const SideSectionControl: Component<Props> = (props) => {
  const showToggle = () => {
    if (props.side === 'leftSide') {
      return appearanceStore[props.side].shown ? '>' : '<';
    } else {
      return appearanceStore[props.side].shown ? '<' : '>';
    }
  };

  return (
    <div
      class={sideSectionControlRoot}
      style={{
        'padding-left': props.side === 'leftSide' ? '5px' : '3px',
        'padding-right': props.side === 'leftSide' ? '3px' : '5px',

        'border-right': props.side === 'leftSide' && !appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',
        'border-left': props.side === 'rightSide' && !appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',
      }}
    >
      <p
        class={sideSectionControlToggle}
        onClick={() => {
          setAppearanceStore(props.side, 'shown', !appearanceStore[props.side].shown);
        }}
      >
        {showToggle()}
      </p>

      <For each={appearanceStore[props.side].tabs}>{(tab, index) => <ControlItem side={props.side} tab={tab} index={index()} />}</For>
    </div>
  );
};

export default SideSectionControl;
