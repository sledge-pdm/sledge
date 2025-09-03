import { onMount } from 'solid-js';
import HardEdgedSection from '~/components/telling_sections/1_hard_edged';
import ChaosEngineSection from '~/components/telling_sections/2_chaos_engine';
import OpenCoreSection from '~/components/telling_sections/3_open_core';
import CodeYourCanvasSection from '~/components/telling_sections/4_code_your_canvas';
import { globalStore } from '~/store/GlobalStore';
import { pageRoot, scrollContent } from '~/styles/page.css';
import { animatedActive } from '~/styles/telling_section.css';

export function Features() {
  const imageSrc = () => {
    switch (globalStore.theme) {
      case 'light':
      default:
        return './0827sledge_light.png';
      case 'black':
        return './0827sledge_black.png';
      case 'dark':
        return './0827sledge_dark.png';
      case 'dark-gy-flip':
        return './0827sledge_darkgyflip.png';
    }
  };
  const isLight = () => globalStore.theme === 'light';
  // intersection observer for simple in-view animations
  let panelEls: HTMLElement[] = [];
  const attachPanelRef = (el: HTMLElement) => {
    panelEls.push(el);
  };

  onMount(() => {
    const animationObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add(animatedActive);
          } else {
            e.target.classList.remove(animatedActive);
          }
        }
      },
      { root: null, threshold: 0.55 }
    );

    panelEls.forEach((el) => animationObserver.observe(el));

    return () => {
      animationObserver.disconnect();
    };
  });

  return (
    <main class={pageRoot}>
      <div class={scrollContent} style={{ 'margin-bottom': '4rem', gap: '4rem' }}>
        {/* Panel 1: HARD EDGED. */}
        <HardEdgedSection attachPanelRef={attachPanelRef} />
        {/* Panel 2: CHAOS ENGINE. */}
        <ChaosEngineSection attachPanelRef={attachPanelRef} />
        {/* Panel 3: OPEN CORE. */}
        <OpenCoreSection attachPanelRef={attachPanelRef} />
        {/* Panel 4: CODE YOUR CANVAS. */}
        <CodeYourCanvasSection attachPanelRef={attachPanelRef} />
      </div>
    </main>
  );
}
