import { getCurrentWindow } from '@tauri-apps/api/window';
import { render } from 'solid-js/web';
import App from './app';
import './styles/global.css';
import './styles/reset.css';
import { safeInvoke } from './utils/TauriUtils';

render(() => {
  // ネイティブスプラッシュを閉じてWebViewを表示
  try {
    const windowLabel = getCurrentWindow().label;
    safeInvoke('show_main_window', { windowLabel });
    console.log('🌐 [PERF] Window transition completed');
  } catch (error) {
    console.error('Failed to transition from native splash:', error);
    // フォールバック
    getCurrentWindow().show();
  }
  return <App />;
}, document.getElementById('root')!);
