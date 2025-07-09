import { vars, ZFB03B } from '@sledge/theme';
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
  startRoot,
  startText,
  themeArea,
} from '~/routes/start.css';
import { globalStore } from '~/store/GlobalStore';

export default function Home() {
  const isLight = () => globalStore.theme === 'light';

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
            <button
              onClick={() => {
                alert('OOPS Sorry Wait for the desktop app to be released!');
              }}
              class={mainButton}
            >
              DOWNLOAD.
            </button>
            <button
              onClick={() => {
                window.open('https://gitlab.com/Innsbluck/sledge', '_blank')?.focus();
              }}
              class={mainButton}
            >
              LOOK INSIDE.
            </button>
          </div>
        </div>

        <img class={startImage} src={isLight() ? '/window_dark.png' : 'window_light.png'} />
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
