import { css } from '@acab/ecsstatic';
import { applyTheme } from '@sledge/theme';
import '@sledge/theme/src/global.css';
import { MetaProvider } from '@solidjs/meta';
import { Navigate, Route, Router } from '@solidjs/router';
import { inject } from '@vercel/analytics';
import { createEffect, onMount, Suspense, type Component } from 'solid-js';
import Header from '~/components/Header';
import ThemeToggle from '~/components/ThemeToggle';
import { About } from '~/routes/about';
import NotFound from '~/routes/not-found';
import { Playground } from '~/routes/play';
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
  height: 100dvh;
  overflow-x: hidden;
  overflow-y: visible;
  z-index: 2;
  border-right: 1px solid var(--color-border-secondary);

  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #dddddd75;
  }

  @media (max-width: 599px) {
    width: 100%;
    border-right: none;
  }
`;

const pageContainer = css`
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 500px;
  box-sizing: content-box;
  @media (max-width: 599px) {
    width: 100%;
  }
`;

const restContainer = css`
  display: flex;
  flex-direction: column;
  width: 0;
  flex-grow: 1;
  height: 100dvh;
  align-items: center;
  justify-content: center;

  @media (max-width: 599px) {
    display: none;
  }
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
  const applyThemeToHtml = () => {
    applyTheme(globalStore.theme);
  };

  onMount(() => {
    inject();
    applyThemeToHtml();
  });

  createEffect(() => {
    localStorage.setItem('theme', globalStore.theme);
    applyThemeToHtml();
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>

          <Suspense>
            <div
              class={flexRow}
              style={{
                width: '100%',
                height: '100dvh',
                'background-color': 'var(--color-surface)',
              }}
            >
              <div
                class={rootContainer}
                style={{
                  'overflow-x': 'hidden',
                  'overflow-y': 'auto',
                  'background-color': 'var(--color-surface)',
                }}
              >
                <Header />

                <div class={pageContainer}>{props.children}</div>
              </div>

              <div class={restContainer}>
                {/* <p>Playground or Descripting matters goes here.</p> */}

                <div
                  style={{
                    opacity: 0.2,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    background: 'url(/icons/misc/tex_45border_16.png) left top',
                    'background-repeat': 'repeat',
                    'background-size': '16px 16px',
                    'z-index': 0,
                  }}
                />
              </div>

              {/* floating UI elements */}
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
            </div>
          </Suspense>
        </MetaProvider>
      )}
    >
      <Route path='/' component={() => <Navigate href={'/about'} />} />
      <Route path='/about' component={About} />
      <Route path='/play' component={Playground} />
      <Route path='*' component={NotFound} />
    </Router>
  );
};

export default App;
