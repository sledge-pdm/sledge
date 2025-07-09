import { flexRow } from '@sledge/core';
import { vars, ZFB03B } from '@sledge/theme';
import ThemeToggle from '~/components/ThemeToggle';
import { content, greetText, mainButton, rightBottomArea, startHeader, startIcon, startRoot, startText, themeArea } from '~/routes/start.css';
import { globalStore } from '~/store/GlobalStore';

export default function Home() {
  const isLight = () => globalStore.theme === 'light';

  return (
    <div class={startRoot}>
      <a href={'/'} class={flexRow} style={{ gap: '1rem', 'align-items': 'center', 'text-decoration': 'none' }}>
        <img class={startIcon} src={isLight() ? '/companion.png' : '/companion_light.png'} width={56} height={56} />
        <p class={startHeader}>SLEDGE.</p>
      </a>

      <div class={content}>
        <p class={greetText}>HELLO.</p>
        <p class={startText}>
          i'm sledge.
          <br />
          simply <span style={{ color: vars.color.active }}>destructive</span> draw tool.
        </p>

        <div style={{ display: 'flex', 'flex-direction': 'row', gap: '2rem', 'flex-wrap': 'wrap' }}>
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
