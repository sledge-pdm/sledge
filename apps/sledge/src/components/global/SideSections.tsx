import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import CanvasSettings from '../section/CanvasSettings';
import Color from '../section/Color';
import LayerList from '../section/LayerList';
import Project from '../section/Project';
import ToolList from '../section/ToolList';

import { flexCol } from '@sledge/core';
import { createScrollPosition } from '@solid-primitives/scroll';
import interact from 'interactjs';
import { adjustZoomToFit } from '~/controllers/canvas/CanvasController';
import { appearanceStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { fadeBottom, fadeTop } from '~/styles/components/scroll_fade.css';
import { sideAreaContent, sideAreaContentWrapper, sideAreaMenu, sideAreaRoot } from '~/styles/globals/side_sections.css';
import SectionTopMenu from './SectionTopMenu';
import { eventBus } from '~/utils/EventBus';

const SideSections: Component = () => {
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
      edges: { right: true },
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
  });

  return (
    <div id='side_sections' class={sideAreaRoot} style={{ width: '350px' }}>
      <div class={sideAreaMenu}>
        <Project />
        <SectionTopMenu />
      </div>
      <div class={flexCol} style={{ position: 'relative', height: '100%', 'flex-grow': 1 }}>
        <div class={sideAreaContentWrapper} ref={(el) => (scrollRef = el)}>
          <div class={flexCol}>
            <div
              class={sideAreaContent}
              style={{
                visibility: appearanceStore.sideAppearanceMode !== 'editor' ? 'hidden' : 'visible',
                height: appearanceStore.sideAppearanceMode !== 'editor' ? '0' : undefined,
              }}
            >
              <Color />
              <ToolList />
              <LayerList />
            </div>

            <div
              class={sideAreaContent}
              style={{
                visibility: appearanceStore.sideAppearanceMode !== 'project' ? 'hidden' : 'visible',
                height: appearanceStore.sideAppearanceMode !== 'project' ? '0' : undefined,
              }}
            >
              <CanvasSettings />
            </div>
          </div>
        </div>

        <Show when={canScrollTop()}>
          <div class={fadeTop} />
        </Show>

        <Show when={canScrollBottom()}>
          <div class={fadeBottom} />
        </Show>
      </div>
    </div>
  );
};

export default SideSections;
