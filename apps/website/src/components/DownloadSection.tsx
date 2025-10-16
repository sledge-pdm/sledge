import { css } from '@acab/ecsstatic';
import { Asset, os, ReleaseData } from '@sledge/core';
import { fonts } from '@sledge/theme';
import { Button, Icon } from '@sledge/ui';
import { Accessor, Component, For, Show } from 'solid-js';

// Styles
const flexCol = css`
  display: flex;
  flex-direction: column;
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
  font-family: ZFB03;
  font-size: 8px;
  opacity: 0.2;
  margin-top: 8px;
  overflow: hidden;
  white-space: normal;
  word-wrap: break-word;
  word-break: break-all;
  user-select: text;
  text-align: end;
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
  opacity: 0.05;
  @media (any-hover: hover) {
    &:hover {
      color: var(--color-active);
      opacity: 0.4;
    }
  }
`;

const DownloadSection: Component<{
  releaseData: {
    isLoading: Accessor<boolean>;
    userOS: Accessor<os>;
    releaseData: Accessor<ReleaseData | null>;
    availableAssets: () => {
      asset: Asset;
      extension: string;
    }[];
    information: () => string | undefined;
  };
}> = ({ releaseData }) => {
  const { isLoading, userOS, releaseData: data, availableAssets, information } = releaseData;
  return (
    <div class={flexCol}>
      <Show when={!isLoading()} fallback={<p class={loadingText}>Loading...</p>}>
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

        <a class={otherDownloadsText} href='https://github.com/sledge-pdm/sledge/releases' target='_blank'>
          other releases
        </a>
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

  return (
    <div
      class={flexCol}
      style={{
        'align-items': 'end',
      }}
    >
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
      <p class={assetText}>
        For {os}
        <br />
        {asset.name}
      </p>
    </div>
  );
};

export default DownloadSection;
