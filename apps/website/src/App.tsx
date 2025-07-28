import { getTheme } from '@sledge/theme';
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { onMount, Suspense, type Component } from 'solid-js';
import Home from '~/routes';
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
            <main class={getTheme(globalStore.theme)}>{props.children}</main>
          </Suspense>

          {/* <p class={sledgeLogo}>sledge.</p> */}
        </MetaProvider>
      )}
    >
      <Route path='/' component={Home} />
    </Router>
  );
};

export default App;
