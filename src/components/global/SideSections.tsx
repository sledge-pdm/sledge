import { Component, createEffect, createSignal, Show } from 'solid-js';
import CanvasSettings from '../section/CanvasSettings';
import Color from '../section/Color';
import LayerList from '../section/LayerList';
import Project from '../section/Project';
import ToolConfig from '../section/ToolConfig';

import { createScrollPosition } from '@solid-primitives/scroll';
import { appearanceStore } from '~/stores/EditorStores';
import { fadeBottom, fadeTop } from '~/styles/components/scroll_fade.css';
import { sideAreaContent, sideAreaContentWrapper, sideAreaMenu, sideAreaRoot } from '~/styles/globals/side_sections.css';
import { flexCol } from '~/styles/snippets.css';
import SectionTopMenu from './SectionTopMenu';

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

  return (
    <div class={sideAreaRoot}>
      <div class={sideAreaMenu}>
        <Project />
        <SectionTopMenu />
      </div>
      <div class={flexCol} style={{ position: 'relative', 'flex-grow': 1,  }}>
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
              <ToolConfig />
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
