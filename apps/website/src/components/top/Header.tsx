import { css } from '@acab/ecsstatic';
import { Asset, os, ReleaseData } from '@sledge/core';
import { makeTimer } from '@solid-primitives/timer';
import { Accessor, Component, createSignal, onMount, Show } from 'solid-js';
import { JSX } from 'solid-js/h/jsx-runtime';

const versionInfoSledge = css`
  font-family: ZFB31;
  text-transform: uppercase;
  letter-spacing: 0px;
  font-size: 36px;
`;
const versionInfoText = css`
  font-family: ZFB09;
  font-size: 8px;
  font-style: italic;
  letter-spacing: 1.5px;
`;

const headerText = css`
  display: flex;
  flex-direction: column;
  gap: 4px 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: baseline;
`;

const Header: Component<{
  subTitle?: JSX.Element;
}> = ({ subTitle }) => {
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
    <p class={headerText}>
      <a href='/' style={{ 'text-decoration': 'none', color: 'inherit' }}>
        <span class={versionInfoSledge}>sledge</span>
      </a>
      <Show when={subTitle}>{subTitle as HTMLElement}</Show>
    </p>
  );
};

export const SubTitleWithReleaseData: Component<{
  isLoading: Accessor<boolean>;
  userOS: Accessor<os>;
  releaseData: Accessor<ReleaseData | null>;
  availableAssets: () => {
    asset: Asset;
    extension: string;
  }[];
  information: () => string | undefined;
}> = (releaseBundle) => {
  return (
    <span
      class={versionInfoText}
      style={{
        color: releaseBundle?.releaseData()?.name ? 'var(--color-accent)' : 'var(--color-error)',
      }}
    >
      {releaseBundle?.releaseData()?.name ?? '[ fetch failed ]'}
    </span>
  );
};

export default Header;
