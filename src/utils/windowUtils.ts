import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

/** 同一ラベルのウィンドウがあれば再利用してフォーカスする */
export async function openSingletonWindow(label: string, url: string) {
  let win = await WebviewWindow.getByLabel(label);
  if (win) {
    win.show();
    win.setFocus();
    return;
  }
  win = new WebviewWindow(label, {
    url,
    width: 450,
    height: 300,
    resizable: false,
    decorations: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    acceptFirstMouse: true,

    focus: true,
    title: label,
  });
}
