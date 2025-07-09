import { getTheme } from '@sledge/theme';
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { Suspense, type Component } from 'solid-js';
import Home from '~/routes';
import { globalStore } from '~/store/GlobalStore';

const App: Component = () => {
  {
    /* <header>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a href='https://github.com/solidjs/solid' target='_blank' rel='noopener noreferrer'>
          Learn Solid
        </a>
      </header> */
  }
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
