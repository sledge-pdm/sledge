import { vars, ZFB03B } from '@sledge/theme';
import { createSignal, onMount } from 'solid-js';
import DownloadSection from '~/components/DownloadSection';
import HardEdgedSection from '~/components/telling_sections/1_hard_edged';
import ChaosEngineSection from '~/components/telling_sections/2_chaos_engine';
import OpenCoreSection from '~/components/telling_sections/3_open_core';
import CodeYourCanvasSection from '~/components/telling_sections/4_code_your_canvas';
import { TellingSection } from '~/components/TellingSection';
import ThemeToggle from '~/components/ThemeToggle';
import { globalStore, setGlobalStore } from '~/store/GlobalStore';
import { animatedActive } from '~/styles/telling_section.css';
import {
  leftContent,
  rightBottomArea,
  scrollContent,
  sledgeText,
  startImage,
  startRoot,
  startText,
  startTextContainer,
  themeArea,
} from './start.css';

export function Start() {
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
  const descriptionFlavors: string[] = [
    'Paint, rearmed.',
    `A tiny hooligan in your pocket.`,
    `Keep it in your pocket. Break when needed.`,
    `Always at hand. Always unruly.`,
    `A hammer with a master.`,
    `Not a studio. A hammer.`,
    `Strike pixels, not canvas.`,
    `8MB. Free. Always ready.`,
    `The pocket-sized sidearm for your pixels.`,
    `Small enough to carry. Sharp enough to cut.`,
    `Notepad for images.`,
    `A glitchpad for your desktop.`,
  ];

  const [flavor, setFlavor] = createSignal(descriptionFlavors[0]);
  // intersection observer for simple in-view animations
  let panelEls: HTMLElement[] = [];
  const attachPanelRef = (el: HTMLElement) => {
    panelEls.push(el);
  };

  let tagEls: HTMLElement[] = [];
  const attachTagRef = (el: HTMLElement) => {
    tagEls.push(el);
  };

  onMount(() => {
    const sectionTagObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            console.log(e.target.textContent);
            setGlobalStore('currentTellingPage', Number(e.target.textContent));
          }
        }
      },
      { root: null, threshold: 0.55 }
    );

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
    tagEls.forEach((el) => sectionTagObserver.observe(el));

    return () => {
      animationObserver.disconnect();
      sectionTagObserver.disconnect();
    };
  });

  return (
    <div class={startRoot}>
      <div class={leftContent}>
        <p class={sledgeText}>SLEDGE.</p>
        <div class={startTextContainer}>
          <p
            class={startText}
            onPointerEnter={() => {
              setFlavor(descriptionFlavors[Math.floor(Math.random() * descriptionFlavors.length)]);
            }}
          >
            {flavor()}
          </p>
        </div>

        <DownloadSection />
      </div>

      <div class={scrollContent}>
        {/* Panel 0: TOP */}
        <TellingSection pageNumber={0}>
          <div>
            <div
              ref={attachPanelRef}
              style={{
                visibility: globalStore.currentTellingPage === 0 ? 'visible' : 'collapse',
                filter: `drop-shadow(0 5px 10px ${isLight() ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)'})`,
                width: '60%',
                margin: 'auto',
                'padding-bottom': '4rem',
              }}
            >
              <img class={startImage} src={imageSrc()} />
            </div>

            <div style={{ display: 'flex', position: 'absolute', bottom: '4rem', left: '3rem' }}>
              <p style={{ 'font-size': '16px' }}>↓ LEARN MORE... ↓</p>
            </div>
          </div>
        </TellingSection>
        {/* Panel 1: HARD EDGED. */}
        <HardEdgedSection attachPanelRef={attachPanelRef} />
        {/* Panel 2: CHAOS ENGINE. */}
        <ChaosEngineSection attachPanelRef={attachPanelRef} />
        {/* Panel 3: OPEN CORE. */}
        <OpenCoreSection attachPanelRef={attachPanelRef} />
        {/* Panel 4: CODE YOUR CANVAS. */}
        <CodeYourCanvasSection attachPanelRef={attachPanelRef} />
      </div>

      {/* floating UI elements */}
      <div class={themeArea}>
        <p style={{ 'font-size': '16px', 'font-family': ZFB03B }}>
          try <span style={{ color: vars.color.accent }}>theme</span> here!
        </p>
        <ThemeToggle noBackground={false} />
      </div>

      <div class={rightBottomArea}>
        <p
          style={{
            'font-family': ZFB03B,
            opacity: 0.6,
          }}
        >
          [C] 2025 sledge all rights reserved.
        </p>
      </div>
    </div>
  );
}
