import { Asset, getDebugReleaseData, getReleaseData, os, osBuildInfos, ReleaseData } from '@sledge/core';
import { k12x8, vars, ZFB03B, ZFB08 } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { createMemo, createSignal, onMount, Show } from 'solid-js';
import FadingImage from '~/components/FadingImage';
import { TellingSection } from '~/components/TellingSection';
import ThemeToggle from '~/components/ThemeToggle';
import { startImageContainer } from '~/routes/start.css';
import {
  animatedActive,
  animatedBlock,
  ButtonAreaContainer,
  greetText,
  heroHeading,
  informationText,
  leftCol,
  mainButton,
  mainButtonContainer,
  panel,
  panelInner,
  rightBottomArea,
  rightCol,
  startImage,
  startRoot,
  startText,
  subHeading,
  themeArea,
  versionInfoText,
} from '~/routes/telling/telling.css';
import { globalStore } from '~/store/GlobalStore';

export default function Telling() {
  const releaseApiUrl =
    import.meta.env.VITE_GITHUB_REST_API_URL +
    '/repos/' +
    import.meta.env.VITE_GITHUB_OWNER +
    '/' +
    import.meta.env.VITE_GITHUB_REPO +
    '/releases/latest';

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
  const descriptionFlavors = [
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

  const flavorDescription = createMemo(() => descriptionFlavors[Math.floor(Math.random() * descriptionFlavors.length)]);

  const [isLoading, setIsLoading] = createSignal(true);

  const [userOS, setUserOS] = createSignal<os>('none');
  const [releaseData, setReleaseData] = createSignal<ReleaseData | null>(null);

  const availableAssets = (): {
    asset: Asset;
    extension: string;
  }[] => {
    if (userOS() === 'none' || !releaseData()) return [];
    const availableExtensions = osBuildInfos[userOS()].extensions;

    return releaseData()!
      .assets.map((asset) => {
        const ext = availableExtensions.find((ext) => asset.name.endsWith(`.${ext}`));
        if (ext) {
          return {
            asset,
            extension: ext,
          };
        }
      })
      .filter((item): item is { asset: Asset; extension: string } => item !== undefined);
  };
  const information = (): string | undefined => {
    if (userOS() === 'none' || !releaseData()) return undefined;
    const information = osBuildInfos[userOS()].information;
    return information;
  };

  onMount(async () => {
    setIsLoading(true);
    const userAgent = navigator.userAgent;
    if (navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
      setUserOS('sp');
    } else if (userAgent.includes('Mac OS X')) {
      setUserOS('macOS');
    } else if (userAgent.includes('Windows')) {
      setUserOS('windows');
    } else if (userAgent.includes('Linux')) {
      setUserOS('linux');
    } else {
      setUserOS('none');
    }

    try {
      let data: ReleaseData | undefined;
      if (location.origin.includes('localhost')) {
        data = getDebugReleaseData();
      } else {
        const githubPat = import.meta.env.VITE_GITHUB_PAT;
        // github api refuses localhost by CORS.
        data = await getReleaseData(releaseApiUrl, githubPat);
      }
      if (!data) {
        console.error('Failed to fetch release data');
      } else {
        setReleaseData(data);
      }
    } catch (e) {
      console.error('Failed to fetch release data', e);
    }
    setIsLoading(false);
  });

  const DownloadButtons = () => {
    const assets = availableAssets();

    return assets.map((item) => {
      const { asset, extension } = item;
      const text = `DOWNLOAD`;
      return (
        <Button
          key={asset.id}
          onClick={() => {
            window.open(asset.browser_download_url, '_blank')?.focus();
          }}
          hoverColor='white'
          class={mainButton}
          style={{
            'text-align': 'start',
            padding: '5px 8px',
            display: 'flex',
            'flex-direction': 'column',
            gap: '4px',
          }}
        >
          <span style={{}}>{text}</span>
          <span style={{ 'font-family': k12x8, 'font-size': '8px', opacity: 0.6 }}>
            {asset.size ? `${Math.round((asset.size / 1024 / 1024) * 100) / 100}MB` : ''} / .{extension}
          </span>
        </Button>
      );
    });
  };

  // intersection observer for simple in-view animations
  let panelEls: HTMLElement[] = [];
  const attachPanelRef = (el: HTMLElement) => {
    panelEls.push(el);
  };

  onMount(() => {
    const io = new IntersectionObserver(
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
    panelEls.forEach((el) => io.observe(el));
  });

  return (
    <div class={startRoot}>
      {/* Panel 0: TOP */}
      <section class={panel}>
        <div class={panelInner}>
          <div class={leftCol}>
            <p class={greetText}>SLEDGE.</p>
            <p class={startText}>Paint, rearmed.</p>

            <Show when={!isLoading()} fallback={<p class={startText}>Loading...</p>}>
              <Show when={information()}>
                <div
                  style={{
                    'background-color': vars.color.surface,
                    padding: vars.spacing.lg,
                    color: vars.color.onBackground,
                    width: 'fit-content',
                    'max-width': '100%',
                  }}
                >
                  <p
                    class={informationText}
                    style={{
                      'font-family': ZFB08,
                      'white-space': 'pre',
                      'font-size': '8px',
                      'margin-bottom': '12px',
                      color: vars.color.accent,
                    }}
                  >
                    for {userOS()} users
                  </p>
                  <p
                    class={informationText}
                    style={{
                      'font-family': k12x8,
                      'line-height': '1.5',
                      'white-space': 'pre',
                      'letter-spacing': '1px',
                      'font-size': '8px',
                    }}
                  >
                    {information()}
                  </p>
                </div>
              </Show>
              <div class={`${ButtonAreaContainer}`}>
                <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
                  <p class={versionInfoText}>
                    Platform: <span style={{ color: vars.color.accent }}>{userOS()}</span>
                  </p>
                </Show>
                <p class={versionInfoText}>
                  Latest Build:{' '}
                  <span style={{ color: releaseData()?.name ? vars.color.accent : vars.color.error }}>
                    {releaseData()?.name ?? '[ fetch failed ]'}
                  </span>
                </p>

                <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
                  <div class={mainButtonContainer}>{DownloadButtons()}</div>
                  <a
                    onClick={() => {
                      window.open('https://github.com/Innsbluck-rh/sledge/releases', '_blank')?.focus();
                    }}
                    style={{ 'text-decoration': 'underline', 'margin-left': '4px', 'margin-top': '8px', color: vars.color.muted }}
                  >
                    OTHER DOWNLOADS.
                  </a>
                </Show>
              </div>
            </Show>
          </div>

          <div
            class={startImageContainer}
            style={{
              filter: `drop-shadow(0 5px 10px ${isLight() ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)'})`,
            }}
          >
            <FadingImage class={startImage} src={imageSrc()} />
          </div>
        </div>
      </section>

      {/* Panel 1: HARD EDGED. */}
      <TellingSection attachPanelRef={attachPanelRef}>
        <div class={leftCol}>
          <h2 class={`${heroHeading} ${animatedBlock}`} ref={attachPanelRef}>
            HARD EDGED.
          </h2>
          <p class={subHeading}>Pixel-perfect editing with destructive operations. Hard edges, sharp states, and immediate feedback.</p>
        </div>
        <div class={rightCol}>
          {/* placeholder visual block */}
          <div
            class={animatedBlock}
            ref={attachPanelRef}
            style={{
              width: '100%',
              height: '50vh',
              background: `linear-gradient(135deg, ${vars.color.accent}22 0%, ${vars.color.accent}55 100%)`,
              border: `1px solid ${vars.color.accent}`,
              'border-radius': '8px',
            }}
          />
        </div>
      </TellingSection>

      {/* Panel 2: CHAOS ENGINE. */}
      <TellingSection attachPanelRef={attachPanelRef}>
        <div class={leftCol}>
          <h2 class={`${heroHeading} ${animatedBlock}`} ref={attachPanelRef}>
            CHAOS ENGINE.
          </h2>
          <p class={subHeading}>Play with noise, patterns, and randomized tools to stir creative chaos—then tame it.</p>
        </div>
        <div class={rightCol}>
          <div
            class={animatedBlock}
            ref={attachPanelRef}
            style={{
              width: '100%',
              height: '50vh',
              background: `repeating-conic-gradient(from 0deg, ${vars.color.accent}22 0% 10%, transparent 10% 20%)`,
              border: `1px dashed ${vars.color.accent}`,
              'border-radius': '8px',
            }}
          />
        </div>
      </TellingSection>

      {/* Panel 3: OPEN CORE. */}
      <TellingSection attachPanelRef={attachPanelRef}>
        <div class={leftCol}>
          <h2 class={`${heroHeading} ${animatedBlock}`} ref={attachPanelRef}>
            OPEN CORE.
          </h2>
          <p class={subHeading}>MIT-licensed core with a transparent roadmap, tests, and a welcoming PR flow.</p>
        </div>
        <div class={rightCol}>
          <div
            class={animatedBlock}
            ref={attachPanelRef}
            style={{
              width: '100%',
              height: '50vh',
              background: vars.color.surface,
              border: `1px solid ${vars.color.muted}`,
              'border-radius': '8px',
              display: 'grid',
              'place-items': 'center',
              color: vars.color.muted,
              'font-family': ZFB03B,
            }}
          >
            open-core docs & api preview
          </div>
        </div>
      </TellingSection>

      {/* Panel 4: CODE YOUR CANVAS. */}
      <TellingSection attachPanelRef={attachPanelRef}>
        <div class={leftCol}>
          <h2 class={`${heroHeading} ${animatedBlock}`} ref={attachPanelRef}>
            CODE YOUR CANVAS.
          </h2>
          <p class={subHeading}>Extend Sledge with WASM-powered tools and scripts. Your canvas, your rules.</p>
          <div class={`${animatedBlock} ${mainButtonContainer}`} ref={attachPanelRef}>
            <Button
              onClick={() => {
                window.open('https://github.com/Innsbluck-rh/sledge', '_blank')?.focus();
              }}
              hoverColor='white'
              class={mainButton}
            >
              VIEW CODE.
            </Button>
          </div>
        </div>
        <div class={rightCol}>
          <div
            class={animatedBlock}
            ref={attachPanelRef}
            style={{
              width: '100%',
              height: '50vh',
              background: `linear-gradient(90deg, ${vars.color.accent}11 0%, ${vars.color.accent}44 50%, ${vars.color.accent}11 100%)`,
              border: `1px solid ${vars.color.accent}`,
              'border-radius': '8px',
            }}
          />
        </div>
      </TellingSection>

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
