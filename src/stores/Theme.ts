import { darkTheme, lightTheme } from '~/styles/global.css';
import { globalConfig } from './GlobalStores';

export const getTheme = () => {
  const storeTheme = globalConfig.misc.theme;
  switch (storeTheme) {
    case 'os':
      // OS設定を初期値に
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      return mq.matches ? darkTheme : lightTheme;
      break;
    case 'light':
      return lightTheme;
      break;
    case 'dark':
      return darkTheme;
      break;
  }
};
