import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';
import { globalStore } from '~/store/GlobalStore';

export const pageImage = css`
  width: 100%;
  max-width: 95%;
  height: auto;
  object-fit: cover;
  object-position: 0 0;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  image-rendering: auto;
`;

const PageImage: Component = () => {
  const imageSrc = () => {
    switch (globalStore.theme) {
      case 'light':
      default:
        return `./0827sledge_light.png`;
      case 'black':
        return `./0827sledge_black.png`;
      case 'dark':
        return `./0827sledge_dark.png`;
      case 'dark-gy-flip':
        return `./0827sledge_darkgyflip.png`;
    }
  };
  const isLight = () => globalStore.theme === 'light';

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        filter: `drop-shadow(0 3px 10px ${isLight() ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'})`,
      }}
    >
      <img class={pageImage} src={imageSrc()} />
    </div>
  );
};

export default PageImage;
