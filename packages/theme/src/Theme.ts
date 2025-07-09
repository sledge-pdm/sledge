import { blackTheme, darkTheme, darkThemeGYFlip, lightTheme } from '@sledge/theme';

export type Theme = 'os' | 'light' | 'dark' | 'dark-gy-flip' | 'black';

export const themeOptions = [
  { label: 'os theme', value: 'os' },
  { label: 'light', value: 'light' },
  { label: 'dark', value: 'dark' },
  { label: 'dark-gy-flip', value: 'dark-gy-flip' },
  { label: 'black', value: 'black' },
];

export const getTheme = (theme: Theme) => {
  switch (theme) {
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
    case 'black':
      return blackTheme;
  }
};
