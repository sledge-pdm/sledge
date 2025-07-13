import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import CanvasSettings from '../section/CanvasSettings';
import Color from '../section/Color';
import LayerList from '../section/LayerList';
import Project from '../section/Project';
import ToolList from '../section/ToolList';

import { flexCol } from '@sledge/core';
import { createScrollPosition } from '@solid-primitives/scroll';
import interact from 'interactjs';
import SideSectionControl from '~/components/global/EdgeInfo';
import { appearanceStore } from '~/stores/EditorStores';
import { fadeBottom, fadeTop } from '~/styles/components/scroll_fade.css';
import { sideAreaContent, sideAreaContentWrapper, sideAreaRoot } from '~/styles/globals/side_sections.css';
import { eventBus } from '~/utils/EventBus';

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
          event.stopPropagation();
          Object.assign(event.target.style, {
            width: `${event.rect.width}px`,
          });
        },
        move: function (event) {
          event.stopPropagation();
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
    <div style={{ display: 'flex', 'flex-direction': props.side === 'leftSide' ? 'row' : 'row-reverse' }}>
      <SideSectionControl side={props.side} />

      <Show when={appearanceStore[props.side].shown}>
        <div id='side_sections' class={sideAreaRoot} style={{ width: '330px' }}>
          <div class={flexCol} style={{ position: 'relative', height: '100%', 'flex-grow': 1 }}>
            <div class={sideAreaContentWrapper} ref={(el) => (scrollRef = el)}>
              <div class={flexCol}>
                <div
                  class={sideAreaContent}
                  style={{
                    visibility: appearanceStore[props.side].selected !== 'editor' ? 'hidden' : 'visible',
                    height: appearanceStore[props.side].selected !== 'editor' ? '0' : undefined,
                  }}
                >
                  <Color />
                  <ToolList />
                  <LayerList />
                </div>

                <div
                  class={sideAreaContent}
                  style={{
                    visibility: appearanceStore[props.side].selected !== 'project' ? 'hidden' : 'visible',
                    height: appearanceStore[props.side].selected !== 'project' ? '0' : undefined,
                  }}
                >
                  <Project />
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
      </Show>
    </div>
  );
};

export default SideSections;
