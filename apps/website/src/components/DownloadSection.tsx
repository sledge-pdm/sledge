import { css } from '@acab/ecsstatic';
import { Asset, getDebugReleaseData, getReleaseData, os, osBuildInfos, ReleaseData } from '@sledge/core';
import { Button, Icon } from '@sledge/ui';
import { Component, createSignal, For, onMount, Show } from 'solid-js';

// Styles
const flexCol = css`
  display: flex;
  flex-direction: column;
`;

const flexRow = css`
  display: flex;
  flex-direction: row;
`;

const versionInfoText = css`
  font-family: k12x8;
  font-size: 8px;
`;

const osInfoText = css`
  font-family: ZFB09;
  font-size: 8px;
`;

const informationText = css`
  font-size: 16px;
  user-select: text;
  @media (max-width: 599px) {
    font-size: 8px;
  }
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
  opacity: 0.5;
  line-height: 1.5;
  overflow: hidden;
  white-space: normal;
  word-wrap: break-word;
  word-break: break-all;
  user-select: text;
`;

const downloadButton = css`
  min-width: 120px;
  font-size: 16px;
  padding: 8px 20px;
  border-width: 2px;
  border-radius: 4px;
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-button-text-on-accent);
  @media (any-hover: hover) {
    &:hover {
      background-color: var(--color-button-bg);
      border-color: var(--color-accent);
      color: var(--color-button-text);
    }
  }
`;

const mainLink = css`
  font-family: k12x8;
  font-size: 8px;
  letter-spacing: 0px;
  color: var(--color-accent);
  text-decoration: underline;
  @media (any-hover: hover) {
    &:hover {
      color: var(--color-active);
      text-decoration: none;
    }
  }
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

  return (
    <div class={flexCol} style={{ width: '100%', gap: '2rem' }}>
      <Show when={!isLoading()} fallback={<p class={loadingText}>Loading...</p>}>
        <div class={flexCol} style={{ width: '100%', 'margin-top': '12px' }}>
          <p class={versionInfoText} style={{ 'margin-bottom': '36px' }}>
            Latest Build:{' '}
            <span class={versionInfoText} style={{ color: releaseData()?.name ? 'var(--color-accent)' : 'var(--color-error)' }}>
              {releaseData()?.name ?? '[ fetch failed ]'}
            </span>
          </p>

          <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
            <div class={flexRow} style={{ gap: '8px', 'align-items': 'center' }}>
              <Icon src='/icons/misc/dot.png' base={8} color={'var(--color-on-background)'} />
              <p class={osInfoText}>
                {' '}
                for{' '}
                <span class={osInfoText} style={{ color: 'var(--color-accent)' }}>
                  {userOS()}
                </span>
              </p>
            </div>
          </Show>
          <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
            <div class={flexCol} style={{ 'margin-top': '12px', 'margin-left': '16px' }}>
              <For each={availableAssets()}>{(assetItem) => <DownloadButton os={userOS()} assetItem={assetItem} />}</For>
            </div>
          </Show>

          <a
            onClick={() => {
              window.open('https://github.com/sledge-pdm/sledge/releases', '_blank')?.focus();
            }}
            class={mainLink}
            style={{ 'margin-top': '48px', color: 'var(--color-muted)' }}
          >
            &gt; OTHER DOWNLOADS.
          </a>

          {/* <div class={flexCol} style={{ width: '100%', gap: '16px' }}>
            <For each={Object.entries(osBuildInfos)}>
              {([key, info]) => {
                const name = key;
                const exts = info.extensions;
                const assets = releaseData()!
                  .assets.filter((asset) => exts.some((ext) => asset.name.endsWith(`.${ext}`)))
                  .map((asset) => {
                    const extension = exts.find((ext) => asset.name.endsWith(`.${ext}`))!;
                    return { asset, extension };
                  });
                if (assets.length === 0) return null;
                return (
                  <div class={flexCol} style={{ width: '100%', gap: '8px' }}>
                    <div class={flexRow} style={{ gap: '8px', 'align-items': 'center' }}>
                      <Icon src='/icons/misc/dot.png' base={8} color={vars.color.onBackground} />
                      <p class={osInfoText}>
                        {' '}
                        for{' '}
                        <span class={osInfoText} style={{ color: vars.color.accent }}>
                          {name}
                        </span>
                      </p>
                    </div>
                    <div class={flexCol} style={{ 'margin-top': '12px', 'margin-left': '16px' }}>
                      <For each={assets}>{(assetItem) => <DownloadButton os={userOS()} assetItem={assetItem} />}</For>
                    </div>
                  </div>
                );
              }}
            </For>
          </div> */}
        </div>
      </Show>
      <Show when={information()}>
        <div
          style={{
            width: '100%',
            'background-color': 'var(--color-surface)',
            padding: 'var(--spacing-lg)',
            color: 'var(--color-on-background)',
          }}
        >
          <p
            class={informationText}
            style={{
              'font-family': 'ZFB08',
              'white-space': 'pre',
              'font-size': '8px',
              'margin-bottom': '8px',
              color: 'var(--color-accent)',
            }}
          >
            for {userOS()} users
          </p>
          <p
            class={informationText}
            style={{
              'font-family': 'k12x8',
              'line-height': '1.5',
              'letter-spacing': '1px',
              'font-size': '8px',
            }}
          >
            {information()}
          </p>
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
}> = ({ os, assetItem }) => {
  const { asset, extension } = assetItem;
  const [showDigest, setShowDigest] = createSignal(false);

  return (
    <>
      <Button
        key={asset.id}
        onClick={() => {
          window.open(asset.browser_download_url, '_blank')?.focus();
        }}
        class={downloadButton}
        style={{
          display: 'flex',
          'flex-direction': 'row',
          'text-align': 'start',
          gap: '4px',
        }}
      >
        <Icon src='/icons/misc/save.png' style={{ width: '16px', height: '16px', 'margin-bottom': '-4px' }} />
        DOWNLOAD
      </Button>
      <p class={assetText} style={{ 'margin-top': '8px' }}>
        file: {asset.name}
      </p>
      <p class={assetText} style={{ 'margin-bottom': '4px' }}>
        size: {asset.size ? `${Math.round((asset.size / 1024 / 1024) * 100) / 100}MB` : ''}
      </p>

      <Show
        when={showDigest()}
        fallback={
          <a class={`${mainLink} ${assetText}`} onClick={() => setShowDigest(true)}>
            show digest
          </a>
        }
      >
        <a class={`${mainLink} ${assetText}`} onClick={() => setShowDigest(false)}>
          hide digest
        </a>
        <p class={assetText} style={{ opacity: 0.7 }}>
          {asset.digest}&nbsp;
          <a
            class={`${mainLink} ${assetText}`}
            onClick={() => {
              navigator.clipboard.writeText(asset.digest);
              alert('copied to clipboard.');
            }}
          >
            copy
          </a>
        </p>
      </Show>
    </>
  );
};

export default DownloadSection;
