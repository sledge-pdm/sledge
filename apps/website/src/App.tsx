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
import PlaygroundIndex from '~/routes/playgrounds';
import PlaygroundWrapper from '~/routes/playgrounds/layout';
import PlaygroundPointerTest from '~/routes/playgrounds/pointer-test';
import { globalStore } from '~/store/GlobalStore';

const rootContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  z-index: 2;
  background-color: var(--color-surface);

  @media (max-width: 599px) {
    width: 100%;
    border-right: none;
    height: auto;
  }
`;

const restContainer = css`
  display: flex;
  flex-direction: column;
  position: relative;
  flex-grow: 1;
  height: 100vh;
  z-index: 2;
`;

const pageContainer = css`
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-secondary);
  overflow-x: hidden;
  overflow-y: visible;
  background-color: var(--color-surface);

  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #dddddd75;
  }

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
    position: fixed;
    top: unset;
    bottom: 28px;
    right: 16px;
    align-items: start;
    margin: 0;
  }
`;

const subRoutesArea = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 60px;
  left: 28px;
  gap: 8px;
  z-index: 10;
  @media (max-width: 599px) {
    position: fixed;
    width: 100%;
    bottom: 10px;
    top: unset;
    left: 8px;
    align-items: start;
    margin: 0;
    z-index: 10 0;
  }
`;
const subRoutesLink = css`
  font-size: 24px;
  font-family: ZFB31;
  text-transform: uppercase;
  opacity: 0.2;
  text-rendering: geometricPrecision;
  text-decoration: none;
  @media (max-width: 599px) {
    font-size: 12px;
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
    right: 16px;
    bottom: 8px;
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
              <div class={pageContainer}>{props.children}</div>

              <div id='portal-root' class={restContainer}>
                <div class={borderBg} />
                <div class={themeArea}>
                  <ThemeToggle noBackground={false} />
                </div>

                <div class={subRoutesArea}>
                  <a class={subRoutesLink} href={'/'}>
                    home
                  </a>
                  <a class={subRoutesLink} href={'/playground'}>
                    playground
                  </a>
                </div>

                <div class={rightBottomArea}>
                  <p
                    style={{
                      'font-family': 'ZFB03B',
                      opacity: 0.15,
                    }}
                  >
                    2025 innsbluck.
                  </p>
                </div>
              </div>
            </div>
          </Suspense>
        </MetaProvider>
      )}
    >
      <Route path='/' component={Home} />
      <Route path='/playground/*' component={PlaygroundWrapper}>
        <Route path='/' component={PlaygroundIndex} />
        <Route path='/pointer-test' component={PlaygroundPointerTest} />
      </Route>
      <Route path='*' component={NotFound} />
    </Router>
  );
};

export default App;
