import { WebviewOptions } from '@tauri-apps/api/webview'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { WindowOptions } from '@tauri-apps/api/window'

/** 同一ラベルのウィンドウがあれば再利用してフォーカスする */
export async function openSingletonWindow(
  label: string,
  options?: Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions
) {
  let win = await WebviewWindow.getByLabel(label)
  if (win) {
    win.show()
    win.setFocus()
    return
  }
  win = new WebviewWindow(label, {
    ...options,
    title: label,
  })
}
