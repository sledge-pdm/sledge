import { Component, onMount } from 'solid-js';

import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import interact from 'interactjs';
import ScrollFadeContainer from '~/components/global/ScrollFadeContainer';
import {
  EditorTab,
  EffectsTab,
  ExportTab,
  FilesTab,
  HistoryTab,
  PerilousTab,
  ProjectTab,
  SectionTab,
} from '~/components/section/SectionTabs';
import { appearanceStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';

const container = css`
  display: flex;
  height: 100%;
  pointer-events: all;
  overflow: visible;
  z-index: var(--zindex-side-section);
`;

const sideAreaRoot = css`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: var(--color-background);
  z-index: var(--zindex-side-section);
  overflow-x: visible;
`;

const sideAreaContentWrapper = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  padding-top: 24px;
  padding-bottom: 48px;
  overflow-x: visible;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    width: 2px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: #888;
  }
`;

const sideAreaContent = css`
  display: flex;
  flex-direction: column;
  overflow-x: visible;
  gap: 8px;
  padding-left: 12px;
  padding-right: 12px;
`;

interface Props {
  side: 'leftSide' | 'rightSide';
}

const SideSectionsOverlay: Component<Props> = (props) => {
  onMount(() => {
    interact('#side-sections-leftSide').resizable({
      edges: { right: true, left: false },
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 300, height: -1 },
          max: { width: 600, height: -1 },
        }),
      ],
      listeners: {
        start: function (event) {
          Object.assign(event.target.style, {
            width: `${event.rect.width}px`,
          });
        },
        move: function (event) {
          let { x, y } = event.target.dataset;
          x = (parseFloat(x) || 0) + event.deltaRect.left;
          Object.assign(event.target.style, {
            width: `${event.rect.width}px`,
          });
          eventBus.emit('window:sideSectionSideChanged', {});
        },
      },
    });
    interact('#side-sections-rightSide').resizable({
      edges: { right: false, left: true },
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 300, height: -1 },
          max: { width: 500, height: -1 },
        }),
      ],
      listeners: {
        start: function (event) {
          Object.assign(event.target.style, {
            width: `${event.rect.width}px`,
          });
        },
        move: function (event) {
          let { x, y } = event.target.dataset;
          x = (parseFloat(x) || 0) + event.deltaRect.left;
          Object.assign(event.target.style, {
            width: `${event.rect.width}px`,
          });
          eventBus.emit('window:sideSectionSideChanged', {});
        },
      },
    });
  });

  const tabContent = (tab: SectionTab) => {
    switch (tab) {
      case 'editor':
        return <EditorTab />;
      case 'effects':
        return <EffectsTab />;
      case 'files':
        return <FilesTab />;
      case 'history':
        return <HistoryTab />;
      case 'project':
        return <ProjectTab />;
      case 'export':
        return <ExportTab />;
      case 'danger':
        return <PerilousTab />;
      default:
        return null;
    }
  };

  const selectedTab = () => appearanceStore[props.side].tabs[appearanceStore[props.side].selectedIndex];

  return (
    <div
      class={container}
      style={{
        'flex-direction': props.side === 'leftSide' ? 'row' : 'row-reverse',

        left: props.side === 'leftSide' ? '0' : 'unset',
        right: props.side === 'rightSide' ? '0' : 'unset',

        'border-right': props.side === 'leftSide' && appearanceStore[props.side].shown ? `1px solid ${color.border}` : 'none',
        'border-left': props.side === 'rightSide' && appearanceStore[props.side].shown ? `1px solid ${color.border}` : 'none',
      }}
    >
      <div
        id={`side-sections-${props.side}`}
        class={sideAreaRoot}
        style={{
          display: appearanceStore[props.side].shown ? 'flex' : 'none',
          width: appearanceStore[props.side].shown ? '300px' : '0px',
        }}
      >
        <ScrollFadeContainer class={sideAreaContentWrapper}>
          <div class={sideAreaContent}>{tabContent(selectedTab())}</div>
        </ScrollFadeContainer>
      </div>
    </div>
  );
};

export default SideSectionsOverlay;
