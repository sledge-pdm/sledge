import { Vec2 } from '@sledge/core';
import { createRAF, targetFPS } from '@solid-primitives/raf';
import { setOffset, setZoomByReference } from '~/features/canvas';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { eventBus } from '~/utils/EventBus';

export interface PanZoomControllerOptions {
  // Pan sensitivity (pixels per tick when at maximum deviation)
  panSensitivity: number;
  // Zoom sensitivity (zoom change per tick when at maximum deviation)
  zoomSensitivity: number;
  // Return-to-center speed
  returnSpeed: number;
  // Maximum deviation from center (in pixels for pan, 0-1 for zoom)
  maxDeviation: number;
  // Deadzone radius (no action within this radius)
  deadzone: number;
}

const defaultOptions: PanZoomControllerOptions = {
  panSensitivity: -6.0,
  zoomSensitivity: 0.05,
  returnSpeed: 0.12,
  maxDeviation: 20,
  deadzone: 1,
};

/**
 * PanZoomController - アナログスティック風のパン・ズーム操作を管理するクラス
 *
 * パン操作:
 * - 2Dスティックの位置に応じてキャンバスをパン
 * - スティックが中心から離れるほど移動速度が増加
 * - 離すと自動的に中心に戻る
 *
 * ズーム操作:
 * - フェーダーの位置に応じてズーム倍率を調整
 * - 中心(0.5)が基準ズーム、上下で拡大/縮小
 * - 離すと自動的に中心に戻る
 */
export class PanZoomController {
  private options: PanZoomControllerOptions;

  // Current positions: pan is 2D (-1 to 1), zoom is 1D (-1 to 1, where 0 is center)
  private panPosition: Vec2 = { x: 0, y: 0 };
  private zoomPosition: number = 0;

  // Target positions (where user input sets them)
  private panTarget: Vec2 = { x: 0, y: 0 };
  private zoomTarget: number = 0;

  // RAF controls
  private isRunning: boolean = false;
  private startRAF: () => void;
  private stopRAF: () => void;

  // Base values to calculate relative changes from
  private baseZoom: number = 1;

  constructor(options: Partial<PanZoomControllerOptions> = {}) {
    this.options = { ...defaultOptions, ...options };

    // Setup RAF loop
    const [isRunning, start, stop] = createRAF(
      targetFPS(() => {
        this.tick();
      }, Number(globalConfig.performance.targetFPS))
    );

    this.startRAF = start;
    this.stopRAF = stop;
  }

  /**
   * パンスティックの位置を設定 (0-1の範囲を-1から1の範囲に変換)
   * @param normalizedX 0-1の範囲の値（0=左端、1=右端）
   * @param normalizedY 0-1の範囲の値（0=上端、1=下端）
   */
  public setPanFromNormalized(normalizedX: number, normalizedY: number): void {
    // 0-1の範囲を-1から1の範囲に変換し、中心を0にする
    const x = (normalizedX - 0.5) * 2;
    const y = (normalizedY - 0.5) * 2;

    this.setPanTarget(x, y);
  }

  /**
   * ズームフェーダーの位置を設定 (0-1の範囲を-1から1の範囲に変換)
   * @param normalized 0-1の範囲の値（0=下端、1=上端）
   */
  public setZoomFromNormalized(normalized: number): void {
    // 0-1の範囲を-1から1の範囲に変換し、中心を0にする
    const z = (normalized - 0.5) * 2;

    this.setZoomTarget(z);
  }

  /**
   * パンのターゲット位置を設定 (-1から1の範囲)
   */
  private setPanTarget(x: number, y: number): void {
    this.panTarget = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * ズームのターゲット位置を設定 (-1から1の範囲)
   */
  private setZoomTarget(z: number): void {
    this.zoomTarget = Math.max(-1, Math.min(1, z));

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * コントローラーを開始
   */
  public start(): void {
    if (!this.isRunning) {
      this.baseZoom = interactStore.zoomByReference;
      this.isRunning = true;
      this.startRAF();
    }
  }

  /**
   * コントローラーを停止
   */
  public stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.stopRAF();
    }
  }

  /**
   * パンスティックをリリース（中心に戻す）
   */
  public releasePan(): void {
    this.panTarget = { x: 0, y: 0 };
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * ズームフェーダーをリリース（中心に戻す）
   */
  public releaseZoom(): void {
    this.zoomTarget = 0;
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * 毎フレーム呼ばれる更新処理
   */
  private tick(): void {
    let needsUpdate = false;

    // Pan position lerp towards target
    const panDx = this.panTarget.x - this.panPosition.x;
    const panDy = this.panTarget.y - this.panPosition.y;

    if (Math.abs(panDx) > 0.001 || Math.abs(panDy) > 0.001) {
      this.panPosition.x += panDx * this.options.returnSpeed;
      this.panPosition.y += panDy * this.options.returnSpeed;
      needsUpdate = true;
    }

    // Zoom position lerp towards target
    const zoomDz = this.zoomTarget - this.zoomPosition;
    if (Math.abs(zoomDz) > 0.001) {
      this.zoomPosition += zoomDz * this.options.returnSpeed;
      needsUpdate = true;
    }

    // Apply pan if beyond deadzone
    const panMagnitude = Math.sqrt(this.panPosition.x * this.panPosition.x + this.panPosition.y * this.panPosition.y);
    if (panMagnitude > this.options.deadzone / this.options.maxDeviation) {
      const currentOffset = interactStore.offset;
      const panDeltaX = this.panPosition.x * this.options.panSensitivity;
      const panDeltaY = this.panPosition.y * this.options.panSensitivity;

      setOffset({
        x: currentOffset.x + panDeltaX,
        y: currentOffset.y + panDeltaY,
      });
    }

    // Apply zoom if beyond deadzone
    if (Math.abs(this.zoomPosition) > this.options.deadzone / this.options.maxDeviation) {
      const zoomDelta = this.zoomPosition * this.options.zoomSensitivity;
      const currentZoom = interactStore.zoomByReference;
      const newZoom = Math.max(interactStore.zoomMin, Math.min(interactStore.zoomMax, currentZoom + zoomDelta));

      if (newZoom !== currentZoom) {
        const zoomOld = interactStore.zoom;
        const zoomChanged = setZoomByReference(newZoom);
        const zoomNew = interactStore.zoom;

        const canvasStack = document.getElementById('canvas-stack');
        const betweenArea = document.getElementById('sections-between-area');
        if (!canvasStack || !betweenArea) {
          eventBus.emit('canvas:onTransformChanged', {});
          return;
        }
        const stackRect = canvasStack.getBoundingClientRect();
        const areaRect = betweenArea.getBoundingClientRect();

        // 可視領域中心 (ビューポート中心 in between area)
        const viewCenterX = areaRect.left + areaRect.width / 2;
        const viewCenterY = areaRect.top + areaRect.height / 2;

        // 旧ズームでの view 中心がキャンバス座標でどこだったか
        const canvasCenterX = (viewCenterX - stackRect.left) / zoomOld;
        const canvasCenterY = (viewCenterY - stackRect.top) / zoomOld;

        // 新ズーム適用後も同じキャンバス座標が中心に来るようにオフセット調整
        // stackRect.left/top は transform 由来で後続再描画まで旧値なので、相対変化のみ計算
        const dx = canvasCenterX * (zoomOld - zoomNew);
        const dy = canvasCenterY * (zoomOld - zoomNew);
        setOffset({
          x: interactStore.offset.x + dx,
          y: interactStore.offset.y + dy,
        });
      }
    }

    // Stop RAF if no movement needed
    if (!needsUpdate && Math.abs(this.panPosition.x) < 0.001 && Math.abs(this.panPosition.y) < 0.001 && Math.abs(this.zoomPosition) < 0.001) {
      this.stop();
    } else {
      eventBus.emit('canvas:onTransformChanged', {});
    }
  }

  /**
   * 現在のパン位置を0-1の範囲で取得
   */
  public getPanNormalized(): Vec2 {
    return {
      x: (this.panPosition.x + 1) * 0.5,
      y: (this.panPosition.y + 1) * 0.5,
    };
  }

  /**
   * 現在のズーム位置を0-1の範囲で取得
   */
  public getZoomNormalized(): number {
    return (this.zoomPosition + 1) * 0.5;
  }

  /**
   * クリーンアップ
   */
  public dispose(): void {
    this.stop();
  }
}
