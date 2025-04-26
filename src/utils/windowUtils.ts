import { WebviewOptions } from '@tauri-apps/api/webview'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { WindowOptions } from '@tauri-apps/api/window'
import { EditorWindowOptions } from '~/routes/editor'
import { FileLocation } from '~/types/FileLocation'

export type WindowOptionsProp = Omit<
  WebviewOptions,
  'x' | 'y' | 'width' | 'height'
> &
  WindowOptions

/** 同一ラベルのウィンドウがあれば再利用してフォーカスする */
export async function openSingletonWindow(
  label: string,
  options?: WindowOptionsProp
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

export async function openEditorWindow(fileLocation?: FileLocation) {
  if (fileLocation === undefined) {
    const editorWin = new WebviewWindow('editor', {
      ...EditorWindowOptions,
      url: `/editor`,
      title: 'sledge',
    })
  } else {
    const params = new URLSearchParams()
    params.append('name', fileLocation.name)
    params.append('path', fileLocation.path)
    const editorWin = new WebviewWindow('editor', {
      ...EditorWindowOptions,
      url: `/editor?${params.toString()}`,
      title: 'sledge',
    })
  }
}
