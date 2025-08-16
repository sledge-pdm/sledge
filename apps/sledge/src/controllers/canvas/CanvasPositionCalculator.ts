import { Vec2 } from '@sledge/core';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';

export function getRelativeCanvasAreaPosition(canvasPos: Vec2) {
  const offsetX = interactStore.offsetOrigin.x + interactStore.offset.x;
  const offsetY = interactStore.offsetOrigin.y + interactStore.offset.y;
  return {
    x: offsetX + canvasPos.x * interactStore.zoom,
    y: offsetY + canvasPos.y * interactStore.zoom,
  };
}

export function clientPositionToCanvasPosition(clientPos: Vec2): Vec2 {
  const canvasRef = document.getElementById('interact-canvas') as HTMLCanvasElement | undefined;
  if (canvasRef === undefined) return { x: 0, y: 0 };
  // pointer 座標
  const clientX = clientPos.x;
  const clientY = clientPos.y;

  // 1. キャンバス中心 (画面座標)
  const rect = canvasRef.getBoundingClientRect();
  const cxScreen = rect.left + rect.width / 2;
  const cyScreen = rect.top + rect.height / 2;

  // 2. 画面中心からのベクトル（scale だけ戻す）
  const dx = (clientX - cxScreen) / interactStore.zoom;
  const dy = (clientY - cyScreen) / interactStore.zoom;

  // 3. 逆回転
  const t = (-interactStore.rotation * Math.PI) / 180; // ←逆向き
  const rx = dx * Math.cos(t) - dy * Math.sin(t);
  const ry = dx * Math.sin(t) + dy * Math.cos(t);

  // 4. キャンバス座標
  const result = {
    x: rx + canvasStore.canvas.width / 2,
    y: ry + canvasStore.canvas.height / 2,
  };

  // Debug: 大きなキャンバス時の精度問題をチェック
  if (canvasStore.canvas.width > 5000 || canvasStore.canvas.height > 5000) {
    console.log('[COORD DEBUG]', {
      clientPos,
      canvasSize: { w: canvasStore.canvas.width, h: canvasStore.canvas.height },
      zoom: interactStore.zoom,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      center: { cxScreen, cyScreen },
      delta: { dx, dy },
      rotated: { rx, ry },
      result,
      // 精度チェック
      precision: {
        dxPrecision: Math.abs(dx - Math.round(dx)),
        dyPrecision: Math.abs(dy - Math.round(dy)),
        rxPrecision: Math.abs(rx - Math.round(rx)),
        ryPrecision: Math.abs(ry - Math.round(ry)),
      }
    });
  }

  return result;
}

export function clientPositionToCanvasPositionWithoutRotation(clientPos: Vec2): Vec2 {
  const canvasRef = document.getElementById('interact-canvas') as HTMLCanvasElement | undefined;
  if (canvasRef === undefined) return { x: 0, y: 0 };
  // pointer 座標
  const clientX = clientPos.x;
  const clientY = clientPos.y;

  // 1. キャンバス中心 (画面座標)
  const rect = canvasRef.getBoundingClientRect();
  const cxScreen = rect.left + rect.width / 2;
  const cyScreen = rect.top + rect.height / 2;

  // 2. 画面中心からのベクトル（scale だけ戻す）
  const dx = (clientX - cxScreen) / interactStore.zoom;
  const dy = (clientY - cyScreen) / interactStore.zoom;

  // 4. キャンバス座標
  return {
    x: dx + canvasStore.canvas.width / 2,
    y: dy + canvasStore.canvas.height / 2,
  };
}
