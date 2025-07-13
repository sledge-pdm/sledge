import { Component } from 'solid-js';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';

import { edgeInfoItem, edgeInfoRoot, edgeInfoText, edgeInfoTextActive } from '~/styles/globals/edge_info.css';

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
    <div class={edgeInfoRoot}>
      <p
        style={{ 'font-size': '16px', cursor: 'pointer' }}
        onClick={() => {
          setAppearanceStore(props.side, 'shown', !appearanceStore[props.side].shown);
        }}
      >
        {showToggle()}
      </p>

      <div class={edgeInfoItem}>
        <a
          class={appearanceStore[props.side].selected === 'editor' ? edgeInfoTextActive : edgeInfoText}
          onClick={async () => {
            if (!appearanceStore[props.side].shown) {
              setAppearanceStore(props.side, 'shown', true);
            } else {
              if (appearanceStore[props.side].selected === 'editor') {
                setAppearanceStore(props.side, 'shown', !appearanceStore[props.side].shown);
              } else {
                setAppearanceStore(props.side, 'shown', true);
              }
            }
            setAppearanceStore(props.side, 'selected', 'editor');
          }}
        >
          editor.
        </a>
      </div>
      <div class={edgeInfoItem}>
        <a
          class={appearanceStore[props.side].selected === 'project' ? edgeInfoTextActive : edgeInfoText}
          onClick={async () => {
            if (!appearanceStore[props.side].shown) {
              setAppearanceStore(props.side, 'shown', true);
            } else {
              if (appearanceStore[props.side].selected === 'project') {
                setAppearanceStore(props.side, 'shown', !appearanceStore[props.side].shown);
              } else {
                setAppearanceStore(props.side, 'shown', true);
              }
            }
            setAppearanceStore(props.side, 'selected', 'project');
          }}
        >
          project.
        </a>
      </div>
      {/* <p class={sideAreaEdgeText}>{projectStore.name || "name N/A"}</p> */}
    </div>
  );
};

export default SideSectionControl;
