import { Icon } from '@sledge/ui';
import { Component, JSX } from 'solid-js';
import { globalStore } from '~/store/GlobalStore';
import { flexRow, heroHeading, pageImage, pageRoot, subHeading } from '~/styles';

export function About() {
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

  return (
    <main class={pageRoot}>
      <p class={heroHeading}>WHAT?</p>
      <p class={subHeading}>Sledge is a pixel-based drawing tool.</p>

      <p class={heroHeading} style={{ 'margin-top': '1rem' }}>
        WHY?
      </p>
      <SubHeadingWithDot>Because it's cool.</SubHeadingWithDot>
      <SubHeadingWithDot>Because it's useful.</SubHeadingWithDot>
      <SubHeadingWithDot>Because it's fast (maybe faster than you think).</SubHeadingWithDot>

      <div
        style={{
          'margin-top': '2rem',
          filter: `drop-shadow(0 5px 10px ${isLight() ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)'})`,
        }}
      >
        <img class={pageImage} src={imageSrc()} />
      </div>
    </main>
  );
}

const SubHeadingWithDot: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  return (
    <div class={flexRow} style={{ 'align-items': 'center', gap: '6px', 'margin-bottom': '8px' }}>
      <Icon src='/icons/misc/dot.png' base={8} color={'var(--color-on-background)'} />
      <p class={subHeading} {...props} style={{ 'margin-bottom': 0, 'vertical-align': 'middle' }}>
        {props.children}
      </p>
    </div>
  );
};
