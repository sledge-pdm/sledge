import { Component, createEffect, createSignal, onMount } from 'solid-js';

import { createScrollPosition } from '@solid-primitives/scroll';
import { EditorTab, EffectsTab, PerilousTab, ProjectTab, SectionTab } from '~/components/section/SectionTabs';
import SideSectionControl from '~/components/section/SideSectionControl';
import { appearanceStore } from '~/stores/EditorStores';

interface Props {
  side: 'leftSide' | 'rightSide';
}

const SideSections: Component<Props> = (props) => {
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
    // interact('#side_sections').resizable({
    //   edges: { right: true, left: true },
    //   modifiers: [
    //     interact.modifiers.restrictSize({
    //       min: { width: 280, height: -1 },
    //       max: { width: 600, height: -1 },
    //     }),
    //   ],
    //   listeners: {
    //     start: function (event) {
    //       event.stopPropagation();
    //       Object.assign(event.target.style, {
    //         width: `${event.rect.width}px`,
    //       });
    //     },
    //     move: function (event) {
    //       event.stopPropagation();
    //       let { x, y } = event.target.dataset;
    //       x = (parseFloat(x) || 0) + event.deltaRect.left;
    //       Object.assign(event.target.style, {
    //         width: `${event.rect.width}px`,
    //       });
    //       eventBus.emit('window:sideSectionSideChanged', {});
    //     },
    //   },
    // });
  });

  const tabContent = (tab: SectionTab) => {
    switch (tab) {
      case 'editor':
        return <EditorTab />;
      case 'effects':
        return <EffectsTab />;
      case 'project':
        return <ProjectTab />;
      case 'perilous':
        return <PerilousTab />;
      default:
        return null;
    }
  };

  const selectedTab = () => appearanceStore[props.side].tabs[appearanceStore[props.side].selectedIndex];

  return (
    <div style={{ display: 'flex', 'flex-direction': props.side === 'leftSide' ? 'row' : 'row-reverse' }}>
    </div>
  );
};

export default SideSections;
