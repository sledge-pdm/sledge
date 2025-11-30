import { css } from '@acab/ecsstatic';
import { applyTheme } from '@sledge/theme';
import '@sledge/theme/src/global.css';
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { inject } from '@vercel/analytics';
import { createEffect, onMount, Suspense, type Component } from 'solid-js';
import TopBar from '~/components/TopBar';
import { Home } from '~/routes';
import NotFound from '~/routes/not-found';
import PlaygroundIndex from '~/routes/playground';
import PlaygroundWrapper from '~/routes/playground/layout';
import PlaygroundPointerTest from '~/routes/playground/pointer-test';
import GetStarted from '~/routes/wiki/introduction/get_started';
import HowToInstall from '~/routes/wiki/introduction/how_to_install';
import Clipboard from '~/routes/wiki/io/clipboard';
import Export from '~/routes/wiki/io/export';
import Import from '~/routes/wiki/io/import';
import SupportedFiles from '~/routes/wiki/io/supported_files';
import WikiWrapper from '~/routes/wiki/layout';
import WikiNotFound from '~/routes/wiki/not-found';
import OnscreenControl from '~/routes/wiki/others/onscreen_control';
import Canvas from '~/routes/wiki/project/canvas';
import Effects from '~/routes/wiki/project/effects';
import ImagePool from '~/routes/wiki/project/image';
import Layer from '~/routes/wiki/project/layer';
import Eraser from '~/routes/wiki/tools/eraser';
import Fill from '~/routes/wiki/tools/fill';
import Move from '~/routes/wiki/tools/move';
import Pen from '~/routes/wiki/tools/pen';
import Selections from '~/routes/wiki/tools/selections';
import { globalStore } from '~/store/GlobalStore';
import { flexCol } from '~/styles';

const rootContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  z-index: 2;
  background-color: var(--color-surface);
`;

const restContainer = css`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  z-index: 2;
`;

const pageContainer = css`
  display: flex;
  flex-direction: column;
  width: 600px;
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
          <Suspense>
            <div class={flexCol}>
              <TopBar />
              <div
                class={rootContainer}
                style={{
                  'overflow-x': 'hidden',
                  'overflow-y': 'auto',
                }}
              >
                <div class={pageContainer}>{props.children}</div>

                <div id='portal-root' class={restContainer}>
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
      <Route path='/wiki/*' component={WikiWrapper}>
        <Route path='/' component={GetStarted} />
        <Route path='/introduction/get_started' component={GetStarted} />
        <Route path='/introduction/how_to_install' component={HowToInstall} />
        <Route path='/tools/pen' component={Pen} />
        <Route path='/tools/eraser' component={Eraser} />
        <Route path='/tools/fill' component={Fill} />
        <Route path='/tools/selections' component={Selections} />
        <Route path='/tools/move' component={Move} />
        <Route path='/project/canvas' component={Canvas} />
        <Route path='/project/layer' component={Layer} />
        <Route path='/project/image' component={ImagePool} />
        <Route path='/project/effects' component={Effects} />
        <Route path='/io/supported_files' component={SupportedFiles} />
        <Route path='/io/import' component={Import} />
        <Route path='/io/export' component={Export} />
        <Route path='/io/clipboard' component={Clipboard} />
        <Route path='/others/onscreen_control' component={OnscreenControl} />
        <Route path='*' component={WikiNotFound} />
      </Route>
      <Route path='*' component={NotFound} />
    </Router>
  );
};

export default App;
