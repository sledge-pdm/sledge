import { Asset, flexCol, getDebugReleaseData, getReleaseData, os, osBuildInfos, ReleaseData } from '@sledge/core';
import { k12x8, vars, ZFB08 } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { mainButton, mainLink } from '~/styles/buttons.css';
import { informationText, loadingText, versionInfoText } from '~/styles/download_section.css';

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

  const DownloadButtons = () => {
    const assets = availableAssets();

    return assets.map((item) => {
      const { asset, extension } = item;
      const text = `for ${userOS()}`;
      return (
        <>
          <Button
            key={asset.id}
            onClick={() => {
              window.open(asset.browser_download_url, '_blank')?.focus();
            }}
            hoverColor='white'
            class={mainButton}
            style={{
              padding: '4px 12px',
              display: 'flex',
              'flex-direction': 'column',
              'text-align': 'start',
              gap: '4px',
            }}
          >
            <span style={{}}>{releaseData()?.tag_name}</span>
            <span style={{ 'font-family': k12x8, 'font-size': '8px', opacity: 0.6 }}>
              for {userOS()} {asset.size ? `${Math.round((asset.size / 1024 / 1024) * 100) / 100}MB` : ''} / .{extension}
            </span>
          </Button>
        </>
      );
    });
  };

  return (
    <div class={flexCol} style={{ width: '100%', gap: '2rem' }}>
      <Show when={!isLoading()} fallback={<p class={loadingText}>Loading...</p>}>
        <div class={flexCol} style={{ gap: '0.5rem', width: '100%', 'margin-top': '12px', 'margin-left': '12px' }}>
          <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
            <p class={versionInfoText}>
              Platform:{' '}
              <span class={versionInfoText} style={{ color: vars.color.accent }}>
                {userOS()}
              </span>
            </p>
          </Show>
          <p class={versionInfoText}>
            Latest Build:{' '}
            <span class={versionInfoText} style={{ color: releaseData()?.name ? vars.color.accent : vars.color.error }}>
              {releaseData()?.name ?? '[ fetch failed ]'}
            </span>
          </p>
          <Show when={userOS() !== 'none' && userOS() !== 'sp'}>
            <div class={flexCol} style={{ 'margin-top': '12px', 'margin-left': '-2px' }}>
              {DownloadButtons()}
            </div>
          </Show>
        </div>
        <a
          onClick={() => {
            window.open('https://github.com/Innsbluck-rh/sledge/releases', '_blank')?.focus();
          }}
          class={mainLink}
          style={{ 'margin-left': '4px', 'margin-top': '24px', color: vars.color.muted }}
        >
          OTHER DOWNLOADS.
        </a>
      </Show>
      <Show when={information()}>
        <div
          style={{
            width: '100%',
            'background-color': vars.color.surface,
            padding: vars.spacing.lg,
            color: vars.color.onBackground,
          }}
        >
          <p
            class={informationText}
            style={{
              'font-family': ZFB08,
              'white-space': 'pre',
              'font-size': '8px',
              'margin-bottom': '8px',
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

export default DownloadSection;
