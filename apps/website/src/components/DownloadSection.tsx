import { css } from '@acab/ecsstatic';
import { Asset, getDebugReleaseData, getReleaseData, os, osBuildInfos, ReleaseData } from '@sledge/core';
import { fonts } from '@sledge/theme';
import { Button, Icon } from '@sledge/ui';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { globalStore } from '~/store/GlobalStore';
import { pageImage } from '~/styles';

// Styles
const flexCol = css`
  display: flex;
  flex-direction: column;
`;

const flexRow = css`
  display: flex;
  flex-direction: row;
`;

const versionInfoSledge = css`
  font-family: ZFB31;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 24px;
`;
const versionInfoText = css`
  font-family: ZFB09;
  font-size: 8px;
`;

const osInfoText = css`
  font-family: ZFB09;
  font-size: 8px;
`;

const informationContainer = css`
  width: 100%;
  background-color: var(--color-surface);
  color: var(--color-on-background);
  margin-top: 16px;
`;

const informationLabel = css`
  user-select: text;
  font-family: ZFB08;
  white-space: pre;
  font-size: 8px;
  margin-bottom: 8px;
  color: var(--color-accent);
`;
const informationText = css`
  user-select: text;
  white-space: pre-wrap;
  font-family: k12x8;
  line-height: 1.5;
  letter-spacing: 1px;
  font-size: 8px;
`;

const loadingText = css`
  font-size: 8px;
  color: var(--color-muted);
  @media (max-width: 599px) {
    font-size: 8px;
  }
`;

const assetText = css`
  width: fit-content;
  font-family: k12x8;
  font-size: 8px;
  opacity: 0.2;
  line-height: 1.5;
  overflow: hidden;
  white-space: normal;
  word-wrap: break-word;
  word-break: break-all;
  user-select: text;
`;

const downloadsContainer = css`
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 12px;
`;

const downloadButton = css`
  font-size: 8px;
  padding: 8px 12px;
  border-width: 1px;
  border-radius: 4px;
  background-color: var(--color-button-bg);
  border-color: var(--color-active);
  color: var(--color-active);
  @media (any-hover: hover) {
    &:hover {
    }
  }
`;

const otherDownloadsText = css`
  width: fit-content;
  font-size: 8px;
  letter-spacing: 0px;
  margin-top: 12px;
  color: var(--color-active);
  text-decoration: none;
  align-self: flex-end;
  opacity: 0.1;
  @media (any-hover: hover) {
    &:hover {
      color: var(--color-active);
      opacity: 0.4;
    }
  }
`;

const flavorTextContainer = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 24px;
  margin-bottom: 16px;
`;

const flavorText = css`
  font-family: k12x8;
  font-size: 8px;
  color: var(--color-active);
  font-style: italic;
  white-space: pre-wrap;
`;

const DownloadSection: Component<{}> = () => {
  const releaseApiUrl =
    import.meta.env.VITE_GITHUB_REST_API_URL +
    '/repos/' +
    import.meta.env.VITE_GITHUB_OWNER +
    '/' +
    import.meta.env.VITE_GITHUB_REPO +
    '/releases/latest';

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
    `8 MB. Free. Always ready.`,
    `The pocket-sized sidearm for your pixels.`,
    `Small enough to carry. Sharp enough to cut.`,
    `Notepad for images.`,
    `A glitchpad for your desktop.`,
  ];

  const [flavor, setFlavor] = createSignal(descriptionFlavors[0]);

  onMount(() => {
    makeTimer(
      () => {
        setFlavor(descriptionFlavors[Math.floor(Math.random() * descriptionFlavors.length)]);
      },
      8000,
      setInterval
    );
  });

  return (
    <div class={flexCol} style={{ width: '100%', gap: '2rem' }}>
      <Show when={!isLoading()} fallback={<p class={loadingText}>Loading...</p>}>
        <div class={flexCol} style={{ width: '100%' }}>
          <p
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '4px 8px',
              'margin-bottom': '24px',
              'flex-wrap': 'wrap',
              'align-items': 'baseline',
            }}
          >
            <span class={versionInfoSledge}>sledge</span>
            <span
              class={versionInfoText}
              style={{
                color: releaseData()?.name ? 'var(--color-accent)' : 'var(--color-error)',
              }}
            >
              {releaseData()?.name ?? '[ fetch failed ]'}
            </span>
          </p>

          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              filter: `drop-shadow(0 3px 5px ${isLight() ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'})`,
              'margin-bottom': '24px',
              'margin-top': '8px',
            }}
          >
            <img class={pageImage} src={imageSrc()} />
          </div>
          {/* <div class={flavorTextContainer}>
            <TypewriterText class={flavorText} text={flavor()} durationPerCharacter={60} />
          </div> */}

          <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
            <div class={downloadsContainer}>
              <For each={availableAssets()}>{(assetItem) => <DownloadButton os={userOS()} assetItem={assetItem} type='main' />}</For>
            </div>
          </Show>

          <Show when={information()}>
            <div class={informationContainer}>
              <p class={informationLabel} style={{}}>
                for {userOS()} users
              </p>
              <p class={informationText}>{information()}</p>
            </div>
          </Show>

          <a class={otherDownloadsText} href='https://github.com/sledge-pdm/sledge/releases'>
            other releases
          </a>
        </div>
      </Show>
    </div>
  );
};
const DownloadButton: Component<{
  os: os;
  assetItem: {
    asset: Asset;
    extension: string;
  };
  type: 'main' | 'other';
}> = ({ os, assetItem, type }) => {
  const { asset, extension } = assetItem;
  const [showDigest, setShowDigest] = createSignal(false);

  return (
    <div
      class={flexCol}
      style={{
        gap: '8px',
        'align-items': 'end',
      }}
    >
      <p class={assetText}>{asset.name}</p>
      <Button
        key={asset.id}
        onClick={() => {
          window.open(asset.browser_download_url, '_blank')?.focus();
        }}
        class={downloadButton}
        style={{
          display: 'flex',
          'font-family': fonts.ZFB09,
          'flex-direction': 'row',
          'text-align': 'start',
          gap: '6px',
        }}
      >
        <Icon src='/icons/misc/save.png' base={8} style={{ width: '16px', height: '16px', 'margin-bottom': '-4px' }} />
        Download
      </Button>
    </div>
  );
};

export default DownloadSection;
