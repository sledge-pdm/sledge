import { type Theme } from '@sledge/theme';
import { createStore } from 'solid-js/store';

export const [globalStore, setGlobalStore] = createStore<{
  theme: Theme;
}>({
  theme: (localStorage.getItem('theme') as Theme) || 'light',
});
