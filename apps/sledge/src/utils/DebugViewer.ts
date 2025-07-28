import { createSignal } from 'solid-js';

export interface DebugImage {
  id: string;
  name: string;
  buffer: Uint8ClampedArray;
  width: number;
  height: number;
  timestamp: number;
}

export interface DebugSession {
  id: string;
  name: string;
  images: DebugImage[];
  timestamp: number;
}

// デバッグセッションの管理
const [debugSessions, setDebugSessions] = createSignal<DebugSession[]>([]);
const [currentSession, setCurrentSession] = createSignal<string | null>(null);
const [isViewerOpen, setIsViewerOpen] = createSignal(false);

let sessionCounter = 0;
let imageCounter = 0;

/**
 * 新しいデバッグセッションを開始
 */
export function startDebugSession(name: string): string {
  const sessionId = `session_${++sessionCounter}_${Date.now()}`;
  const session: DebugSession = {
    id: sessionId,
    name,
    images: [],
    timestamp: Date.now(),
  };

  setDebugSessions((prev) => [...prev, session]);
  setCurrentSession(sessionId);

  return sessionId;
}

/**
 * 現在のセッションに画像を追加
 */
export function addDebugImage(buffer: Uint8ClampedArray | Uint8Array, width: number, height: number, name: string, sessionId?: string): void {
  const targetSessionId = sessionId || currentSession();
  if (!targetSessionId) {
    console.warn('No active debug session. Call startDebugSession() first.');
    return;
  }

  const imageId = `img_${++imageCounter}_${Date.now()}`;
  const debugImage: DebugImage = {
    id: imageId,
    name,
    buffer: buffer instanceof Uint8Array ? new Uint8ClampedArray(buffer) : buffer,
    width,
    height,
    timestamp: Date.now(),
  };

  setDebugSessions((prev) =>
    prev.map((session) => (session.id === targetSessionId ? { ...session, images: [...session.images, debugImage] } : session))
  );
}

/**
 * デバッグセッションを終了
 */
export function endDebugSession(): void {
  setCurrentSession(null);
}

/**
 * デバッグビューアを開く
 */
export function openDebugViewer(): void {
  setIsViewerOpen(true);
}

/**
 * デバッグビューアを閉じる
 */
export function closeDebugViewer(): void {
  setIsViewerOpen(false);
}

/**
 * 全てのデバッグデータをクリア
 */
export function clearDebugData(): void {
  setDebugSessions([]);
  setCurrentSession(null);
}

/**
 * 特定のセッションを削除
 */
export function removeDebugSession(sessionId: string): void {
  setDebugSessions((prev) => prev.filter((session) => session.id !== sessionId));
  if (currentSession() === sessionId) {
    setCurrentSession(null);
  }
}

/**
 * バッファをData URLに変換
 */
export function bufferToDataURL(buffer: Uint8ClampedArray, width: number, height: number): string {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const imageData = new ImageData(buffer, width, height);
  ctx.putImageData(imageData, 0, 0);

  // OffscreenCanvasのconvertToBlobは非同期なので、同期的な方法を使用
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Failed to get temp canvas context');

  tempCtx.putImageData(imageData, 0, 0);
  return tempCanvas.toDataURL('image/png');
}

// エクスポート用のゲッター
export const getDebugSessions = debugSessions;
export const getCurrentSession = currentSession;
export const getIsViewerOpen = isViewerOpen;

// 便利な関数：選択範囲マスクを可視化用バッファに変換
export function visualizeSelectionMask(mask: Uint8Array, width: number, height: number): Uint8ClampedArray {
  const buffer = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < mask.length; i++) {
    const bufferIndex = i * 4;
    if (mask[i] === 1) {
      // 選択範囲は緑で表示
      buffer[bufferIndex] = 0; // R
      buffer[bufferIndex + 1] = 255; // G
      buffer[bufferIndex + 2] = 0; // B
      buffer[bufferIndex + 3] = 128; // A (半透明)
    } else {
      // 非選択範囲は赤で表示
      buffer[bufferIndex] = 255; // R
      buffer[bufferIndex + 1] = 0; // G
      buffer[bufferIndex + 2] = 0; // B
      buffer[bufferIndex + 3] = 64; // A (より薄い)
    }
  }

  return buffer;
}
