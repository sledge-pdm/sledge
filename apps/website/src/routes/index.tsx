import { vars, ZFB03B } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { createSignal, onMount, Show } from 'solid-js';
import FadingImage from '~/components/FadingImage';
import ThemeToggle from '~/components/ThemeToggle';
import {
  ButtonAreaContainer,
  content,
  description,
  greetText,
  header,
  mainButton,
  mainButtonContainer,
  rightBottomArea,
  startIcon,
  startImage,
  startImageContainer,
  startRoot,
  startText,
  themeArea,
  versionInfoText,
} from '~/routes/start.css';
import { globalStore } from '~/store/GlobalStore';
import { Asset, ReleaseData } from '~/types/release';

type os = 'sp' | 'macOS' | 'windows' | 'linux' | 'none';
const options: { [key in os]: { name: string; extensions: string[] } } = {
  sp: {
    name: 'sp',
    extensions: [],
  },
  none: {
    name: 'None',
    extensions: [],
  },
  macOS: {
    name: 'macOS',
    extensions: ['dmg', 'tar.gz'],
  },
  windows: {
    name: 'Windows',
    extensions: ['msi', 'exe'],
  },
  linux: {
    name: 'Linux',
    extensions: ['rpm', 'AppImage', 'deb'],
  },
};

export default function Home() {
  const isLight = () => globalStore.theme === 'light';

  const downloadFlavorTexts = ['Take This!'];

  const [downloadFlavor, setDownloadFlavor] = createSignal(downloadFlavorTexts[Math.floor(Math.random() * downloadFlavorTexts.length)]);
  const changeDownloadFlavor = () => {
    setDownloadFlavor(downloadFlavorTexts[Math.floor(Math.random() * downloadFlavorTexts.length)]);
  };

  const [userOS, setUserOS] = createSignal<os>('none');
  const [releaseData, setReleaseData] = createSignal<ReleaseData | null>(null);

  const availableAssets = (): {
    asset: Asset;
    extension: string;
  }[] => {
    if (userOS() === 'none' || !releaseData()) return [];

    const availableExtensions = options[userOS()].extensions;

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

  const releaseApiUrl =
    import.meta.env.VITE_GITHUB_REST_API_URL +
    '/repos/' +
    import.meta.env.VITE_GITHUB_OWNER +
    '/' +
    import.meta.env.VITE_GITHUB_REPO +
    '/releases/latest';

  onMount(async () => {
    const response = await fetch(releaseApiUrl);
    const data = await response.json();

    setReleaseData(data);

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
  });

  const DownloadButtons = () => {
    const assets = availableAssets();

    return assets.map((item) => {
      const { asset, extension } = item;
      const text = `DOWNLOAD (.${extension})`;
      return (
        <Button
          key={asset.id}
          onClick={() => {
            window.open(asset.browser_download_url, '_blank')?.focus();
          }}
          hoverColor='white'
          class={mainButton}
        >
          {text}
        </Button>
      );
    });
  };

  return (
    <div class={startRoot}>
      <a href={'https://github.com/Innsbluck-rh/sledge'} target='_blank' class={header} style={{ width: 'fit-content' }}>
        <img class={startIcon} src={isLight() ? '/companion.png' : '/companion_light.png'} width={56} height={56} />
        {/* <p class={startHeader}>SLEDGE.</p> */}
      </a>

      <div class={content}>
        <div class={description}>
          <p class={greetText}>HELLO.</p>
          <p class={startText}>
            i'm sledge.
            <br />
            simply <span style={{ color: vars.color.active }}>destructive</span> draw tool.
          </p>
          <div class={ButtonAreaContainer}>
            <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
              <p class={versionInfoText}>
                Platform: <span style={{ color: vars.color.accent }}>{userOS()}</span>
              </p>
            </Show>
            <p class={versionInfoText}>
              Latest Build: <span style={{ color: vars.color.accent }}>{releaseData()?.name}</span>
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

            <Show when={userOS() === 'sp'}>
              <Button
                onClick={() => {
                  window.open('https://github.com/Innsbluck-rh/sledge', '_blank')?.focus();
                }}
                hoverColor='white'
                class={mainButton}
              >
                VIEW CODE.
              </Button>
            </Show>
          </div>
        </div>
        <div
          class={startImageContainer}
          style={{
            filter: `drop-shadow(0 5px 10px ${isLight() ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)'})`,
          }}
        >
          <FadingImage class={startImage} src={isLight() ? '/window_dark.png' : '/window_light.png'} />
        </div>
      </div>

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
