import { Component, For } from 'solid-js';
import { appearanceStore, SectionTab, setAppearanceStore } from '~/stores/EditorStores';

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
  const selected = () => appearanceStore[props.side].selectedIndex === props.index;
  return (
    <div class={sideSectionControlItem}>
      <a
        class={selected() ? sideSectionControlTextActive : sideSectionControlText}
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
        'padding-left': props.side === 'leftSide' ? '6px' : '2px',
        'padding-right': props.side === 'leftSide' ? '2px' : '6px',
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
