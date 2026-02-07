import { render } from 'solid-js/web';
import App from './app';
import { setPlatform } from './utils/platform';
import { createTauriPlatform } from './utils/platform/TauriPlatform';

setPlatform(createTauriPlatform());

render(() => <App />, document.getElementById('root')!);
