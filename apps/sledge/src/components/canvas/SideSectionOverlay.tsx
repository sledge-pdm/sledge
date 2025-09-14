import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';

import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { createScrollPosition } from '@solid-primitives/scroll';
import interact from 'interactjs';
import { EditorTab, EffectsTab, ExportTab, HistoryTab, PerilousTab, ProjectTab, SectionTab } from '~/components/section/SectionTabs';
import { Consts } from '~/Consts';
import { appearanceStore } from '~/stores/EditorStores';
import { fadeBottom, fadeTop } from '~/styles/components/scroll_fade.css';
import { sideAreaContent, sideAreaContentWrapper, sideAreaRoot } from '~/styles/section/side_sections.css';
import { eventBus } from '~/utils/EventBus';

interface Props {
  side: 'leftSide' | 'rightSide';
}

const SideSectionsOverlay: Component<Props> = (props) => {
  let scrollRef: HTMLDivElement | undefined;
  const scroll = createScrollPosition(() => scrollRef);

  const [canScrollTop, setCanScrollTop] = createSignal(false);
  const [canScrollBottom, setCanScrollBottom] = createSignal(false);

  createEffect(() => {
    scroll.y;
    if (scrollRef) {
      setCanScrollTop(scrollRef.scrollTop > 0);
      setCanScrollBottom(scrollRef.scrollTop + scrollRef.clientHeight < scrollRef.scrollHeight);
    }
  });

  onMount(() => {
    interact('#side_sections').resizable({
      edges: { right: true, left: true },
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 280, height: -1 },
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
  });

  const tabContent = (tab: SectionTab) => {
    switch (tab) {
      case 'editor':
        return <EditorTab />;
      case 'effects':
        return <EffectsTab />;
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
      style={{
        display: 'flex',
        'flex-direction': props.side === 'leftSide' ? 'row' : 'row-reverse',
        height: '100%',
        left: props.side === 'leftSide' ? '0' : 'unset',
        right: props.side === 'rightSide' ? '0' : 'unset',

        'border-right': props.side === 'leftSide' && appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',
        'border-left': props.side === 'rightSide' && appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',

        'pointer-events': 'all',
        overflow: 'visible',
        'z-index': Consts.zIndex.sideSection,
      }}
    >
      <div
        id='side_sections'
        class={sideAreaRoot}
        style={{
          display: appearanceStore[props.side].shown ? 'flex' : 'none',
          width: appearanceStore[props.side].shown ? '320px' : '0px',
        }}
      >
        <div class={flexCol} style={{ position: 'relative', height: '100%', 'flex-grow': 1 }}>
          <div class={sideAreaContentWrapper} ref={(el) => (scrollRef = el)}>
            <div class={sideAreaContent}>{tabContent(selectedTab())}</div>
          </div>

          <Show when={canScrollTop()}>
            <div class={fadeTop} />
          </Show>

          <Show when={canScrollBottom()}>
            <div class={fadeBottom} />
          </Show>
        </div>
      </div>
    </div>
  );
};

export default SideSectionsOverlay;
