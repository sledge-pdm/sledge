import { darkTheme, darkThemeGYFlip, lightTheme } from '~/styles/global.css';
import { globalConfig } from './GlobalStores';

export const getTheme = () => {
  const storeTheme = globalConfig.appearance.theme;
  switch (storeTheme) {
    case 'os':
      // OS設定を初期値に
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      return mq.matches ? darkTheme : lightTheme;
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'dark-gy-flip':
      return darkThemeGYFlip;
  }
};
