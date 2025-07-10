import { vars, ZFB03B } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { createSignal } from 'solid-js';
import FadingImage from '~/components/FadingImage';
import ThemeToggle from '~/components/ThemeToggle';
import {
  content,
  description,
  greetText,
  header,
  mainButton,
  mainButtonContainer,
  rightBottomArea,
  startHeader,
  startIcon,
  startImage,
  startImageContainer,
  startRoot,
  startText,
  themeArea,
} from '~/routes/start.css';
import { globalStore } from '~/store/GlobalStore';

export default function Home() {
  const isLight = () => globalStore.theme === 'light';

  const downloadFlavorTexts = ['Take This!'];

  const [downloadFlavor, setDownloadFlavor] = createSignal(downloadFlavorTexts[Math.floor(Math.random() * downloadFlavorTexts.length)]);
  const changeDownloadFlavor = () => {
    setDownloadFlavor(downloadFlavorTexts[Math.floor(Math.random() * downloadFlavorTexts.length)]);
  };

  return (
    <div class={startRoot}>
      <a href={'/'} class={header}>
        <img class={startIcon} src={isLight() ? '/companion.png' : '/companion_light.png'} width={56} height={56} />
        <p class={startHeader}>SLEDGE.</p>
      </a>

      <div class={content}>
        <div class={description}>
          <p class={greetText}>HELLO.</p>
          <p class={startText}>
            i'm sledge.
            <br />
            simply <span style={{ color: vars.color.active }}>destructive</span> draw tool.
          </p>
          <div class={mainButtonContainer}>
            <Button
              onClick={() => {
                alert('OOPS Sorry Wait for the desktop app to be released!');
              }}
              onPointerEnter={() => {
                changeDownloadFlavor();
              }}
              hoverContent={downloadFlavor()}
              class={mainButton}
            >
              DOWNLOAD.
            </Button>
            <Button
              onClick={() => {
                window.open('https://gitlab.com/Innsbluck/sledge', '_blank')?.focus();
              }}
              hoverContent='and join us.'
              class={mainButton}
            >
              LOOK INSIDE.
            </Button>
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
