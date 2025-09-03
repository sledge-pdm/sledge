import { globalStore } from '~/store/GlobalStore';
import { heroHeading, pageRoot, subHeading } from '~/styles/page.css';
import { sectionImage } from '~/styles/telling_section.css';

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
      <p class={heroHeading}>ABOUT.</p>
      <p class={subHeading}>Sledge is a drawing tool.</p>

      <p class={subHeading}>
        Sledge is a drawing tool.
        <br />
        Sledge is a drawing tool.
        <br />
        Sledge is a drawing tool.
      </p>
      <div
        style={{
          'margin-top': '2rem',
          filter: `drop-shadow(0 5px 10px ${isLight() ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)'})`,
        }}
      >
        <img class={sectionImage} src={imageSrc()} />
      </div>
    </main>
  );
}
