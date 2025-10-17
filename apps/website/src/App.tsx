import { css } from '@acab/ecsstatic';
import { applyTheme } from '@sledge/theme';
import '@sledge/theme/src/global.css';
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { inject } from '@vercel/analytics';
import { createEffect, onMount, Suspense, type Component } from 'solid-js';
import ThemeToggle from '~/components/ThemeToggle';
import { Home } from '~/routes';
import NotFound from '~/routes/not-found';
import { globalStore } from '~/store/GlobalStore';

// Styles
const flexRow = css`
  display: flex;
  flex-direction: row;
`;

const rootContainer = css`
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: visible;
  z-index: 2;
  background-color: var(--color-surface);

  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #dddddd75;
  }

  @media (max-width: 599px) {
    width: 100%;
    border-right: none;
    height: auto;
  }
`;

const pageContainer = css`
  position: absolute;
  top: 0;
  left: 0;
  width: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-secondary);
  background-color: var(--color-surface);

  @media (max-width: 599px) {
    position: initial;
    /* background-color: var(--color-background); */
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    width: 100%;
    height: fit-content;
  }
`;

const borderBg = css`
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  height: 100dvh;
  width: 100dvw;
  z-index: -1;
  opacity: 0.2;
  background: url(/icons/misc/tex_45border_16.png) left top;
  background-repeat: repeat;
  background-size: 16px 16px;
`;

const themeArea = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  gap: var(--spacing-md);
  align-items: end;
  margin: 1rem;
  z-index: 10;
  @media (max-width: 599px) {
    top: unset;
    bottom: var(--spacing-xl);
    left: var(--spacing-xl);
    align-items: start;
    margin: 0;
  }
`;

const rightBottomArea = css`
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  gap: var(--spacing-md);
  margin-right: 1rem;
  align-items: end;
  z-index: 10;
  @media (max-width: 599px) {
    margin-right: 0;
  }
`;

const App: Component = () => {
  onMount(() => {
    inject();
    applyTheme(globalStore.theme);
  });

  createEffect(() => {
    localStorage.setItem('theme', globalStore.theme);
    applyTheme(globalStore.theme);
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>

          <Suspense>
            <div
              class={rootContainer}
              style={{
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
              }}
            >
              <div class={borderBg} />

              <div class={themeArea}>
                <ThemeToggle noBackground={false} />
              </div>

              <div class={rightBottomArea}>
                <p
                  style={{
                    'font-family': 'ZFB03B',
                    opacity: 0.6,
                  }}
                >
                  2025 sledge all rights reserved.
                </p>
              </div>

              <div class={pageContainer}>{props.children}</div>
            </div>
          </Suspense>
        </MetaProvider>
      )}
    >
      <Route path='/' component={Home} />
      <Route path='*' component={NotFound} />
    </Router>
  );
};

export default App;
