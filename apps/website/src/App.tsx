import { flexRow } from '@sledge/core';
import { getTheme, vars, ZFB03B } from '@sledge/theme';
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { createEffect, onMount, Suspense, type Component } from 'solid-js';
import Header from '~/components/Header';
import ThemeToggle from '~/components/ThemeToggle';
import { About } from '~/routes/about';
import { Download } from '~/routes/downloads';
import { Features } from '~/routes/features';
import { Playground } from '~/routes/play';
import { globalStore } from '~/store/GlobalStore';
import { pageContainer, restContainer, rootContainer } from '~/styles/app.css';
import { rightBottomArea, themeArea } from '~/styles/page.css';

const App: Component = () => {
  onMount(() => {
    localStorage.setItem('theme', globalStore.theme);
  });

  // テーマクラスを html 要素に付与して、Portal や body 直下にもトークンが届くようにする
  let prevThemeClass: string | undefined;
  const applyThemeToHtml = () => {
    const cls = getTheme(globalStore.theme);
    const html = document.documentElement;
    if (prevThemeClass && html.classList.contains(prevThemeClass)) {
      html.classList.remove(prevThemeClass);
    }
    html.classList.add(cls);
    prevThemeClass = cls;
  };

  onMount(async () => {
    applyThemeToHtml();
  });

  createEffect(applyThemeToHtml);

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>

          <svg viewBox={`0 0 0 0`} xmlns='http://www.w3.org/2000/svg' style={{}}>
            <defs>
              <pattern id='tex45borderPattern' x='0' y='0' width='8' height='8' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
                <image href='/icons/misc/tex_45border.png' x='0' y='0' width='8' height='8' style={{ 'image-rendering': 'pixelated' }} />
              </pattern>
              <pattern id='tex45borderPattern-svg' width='8' height='8' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
                <svg width='8' height='8' viewBox='0 0 8 8'>
                  <path
                    d='M 0 8 L 1 8 L 1 6 L 3 6 L 3 4 L 5 4 L 5 2 L 7 2 L 7 0 L 8 0 L 8 1 L 6 1 L 6 3 L 4 3 L 4 5 L 2 5 L 2 7 L 0 7 L 0 8 Z M 4 8 L 5 8 L 5 6 L 7 6 L 7 4 L 8 4 L 8 5 L 6 5 L 6 7 L 4 7 L 4 8 Z M 1 2 L 3 2 L 3 0 L 4 0 L 4 1 L 2 1 L 2 3 L 0 3 L 0 4 L 1 4 L 1 2 Z'
                    fill={vars.color.selectionBorderFill}
                  />
                </svg>
              </pattern>

              <pattern
                id='tex45borderPattern8x2'
                x='0'
                y='0'
                width='16'
                height='16'
                patternUnits='userSpaceOnUse'
                patternContentUnits='userSpaceOnUse'
              >
                <image href='/icons/misc/tex_45border.png' x='0' y='0' width='16' height='16' style={{ 'image-rendering': 'pixelated' }} />
              </pattern>
              <pattern id='tex45borderPattern8x2-svg' width='16' height='16' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
                <svg width='16' height='16' viewBox='0 0 8 8'>
                  <path
                    d='M 0 8 L 1 8 L 1 6 L 3 6 L 3 4 L 5 4 L 5 2 L 7 2 L 7 0 L 8 0 L 8 1 L 6 1 L 6 3 L 4 3 L 4 5 L 2 5 L 2 7 L 0 7 L 0 8 Z M 4 8 L 5 8 L 5 6 L 7 6 L 7 4 L 8 4 L 8 5 L 6 5 L 6 7 L 4 7 L 4 8 Z M 1 2 L 3 2 L 3 0 L 4 0 L 4 1 L 2 1 L 2 3 L 0 3 L 0 4 L 1 4 L 1 2 Z'
                    fill={vars.color.selectionBorderFill}
                  />
                </svg>
              </pattern>

              <pattern
                id='tex45borderPattern16'
                x='0'
                y='0'
                width='16'
                height='16'
                patternUnits='userSpaceOnUse'
                patternContentUnits='userSpaceOnUse'
              >
                <image href='/icons/misc/tex_45border_16.png' x='0' y='0' width='16' height='16' style={{ 'image-rendering': 'pixelated' }} />
              </pattern>
              <pattern id='tex45borderPattern16-svg' width='16' height='16' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
                <svg width='16' height='16' viewBox='0 0 16 16'>
                  <path
                    d='M 5 10 L 7 10 L 7 8 L 9 8 L 9 6 L 11 6 L 11 4 L 13 4 L 13 2 L 15 2 L 15 0 L 16 0 L 16 1 L 14 1 L 14 3 L 12 3 L 12 5 L 10 5 L 10 7 L 8 7 L 8 9 L 6 9 L 6 11 L 4 11 L 4 13 L 2 13 L 2 15 L 0 15 L 0 16 L 1 16 L 1 14 L 3 14 L 3 12 L 5 12 L 5 10 Z M 13 10 L 15 10 L 15 8 L 16 8 L 16 9 L 14 9 L 14 11 L 12 11 L 12 13 L 10 13 L 10 15 L 8 15 L 8 16 L 9 16 L 9 14 L 11 14 L 11 12 L 13 12 L 13 10 Z M 0 7 L 2 7 L 2 5 L 4 5 L 4 3 L 6 3 L 6 1 L 8 1 L 8 0 L 7 0 L 7 2 L 5 2 L 5 4 L 3 4 L 3 6 L 1 6 L 1 8 L 0 8 L 0 7 Z'
                    fill={vars.color.selectionBorderFill}
                  />
                </svg>
              </pattern>
            </defs>
          </svg>
          <Suspense>
            <div
              class={flexRow}
              style={{
                width: '100%',
                height: '100dvh',
                'background-color': vars.color.surface,
              }}
            >
              <div
                class={rootContainer}
                style={{
                  'overflow-x': 'hidden',
                  'overflow-y': 'auto',
                  'background-color': vars.color.background,
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
                    'font-family': ZFB03B,
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
      <Route path='/' component={About} />
      <Route path='/features' component={Features} />
      <Route path='/play' component={Playground} />
      <Route path='/download' component={Download} />
    </Router>
  );
};

export default App;
