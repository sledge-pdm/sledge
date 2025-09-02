import { getTheme, vars } from '@sledge/theme';
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { onMount, Suspense, type Component } from 'solid-js';
import Home from '~/routes';
import Telling from '~/routes/telling';
import { globalStore } from '~/store/GlobalStore';

const App: Component = () => {
  onMount(() => {
    localStorage.setItem('theme', globalStore.theme);
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <Suspense>
            <main
              class={getTheme(globalStore.theme)}
              style={{
                background: vars.color.surface,
              }}
            >
              {props.children}
            </main>
          </Suspense>

          {/* <p class={sledgeLogo}>sledge.</p> */}
        </MetaProvider>
      )}
    >
      <Route path='/' component={Home} />
      <Route path='/telling' component={Telling} />
    </Router>
  );
};

export default App;
