import { createEffect, createSignal } from 'solid-js';
import { darkTheme, lightTheme } from '~/styles/global.css';
import { globalConfig } from './GlobalStores';
export const [theme, setTheme] = createSignal<string>(lightTheme);

createEffect(() => {
  const storeTheme = globalConfig.misc.theme;
  switch (globalConfig.misc.theme) {
    case 'os':
      // OS設定を初期値に
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(mq.matches ? darkTheme : lightTheme);
      mq.addEventListener('change', (e) => setTheme(e.matches ? 'dark' : 'light'));
      break;
    case 'light':
      setTheme(lightTheme);
      break;
    case 'dark':
      setTheme(darkTheme);
      break;
  }
});
