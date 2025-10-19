import { Vec2 } from '@sledge/core';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Consts } from '~/Consts';
import { getReferencedZoom, setOffset, setRotation, setZoom } from '~/features/canvas';
import { projectHistoryController } from '~/features/history';
import { DebugLogger } from '~/features/log/service';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { interactStore, setInteractStore, toolStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { isMacOS } from '~/utils/OSUtils';
import TouchRotationSnapper from './TouchRotationSnapper';

const LOG_LABEL = 'CanvasAreaInteract';
const logger = new DebugLogger(LOG_LABEL, false);

class CanvasAreaInteract {
  private pointers = new Map<number, Vec2>();

  private lastPointX: number = 0;
  private lastPointY: number = 0;

  private lastDist: number = 0;
  private lastAngle: number = 0;

  // --- RAF based pinch processing state ---
  private pinchDirty = false; // true when new 2-finger data arrived since last RAF application
  private lastAppliedDist = 0; // distance at last applied frame
  private lastAppliedAngle = 0; // angle (radian) at last applied frame
  private lastAppliedMidX = 0; // midpoint (screen) at last applied frame
  private lastAppliedMidY = 0;

  private rafRunning?: () => boolean; // accessor from createRAF
  private startRaf?: () => void;
  private stopRaf?: () => void;

  // タッチ回転用スナッパ（2本指ジェスチャ中のみ動作）
  private rotationSnapper = new TouchRotationSnapper();


  public updateCursor = (cursor: 'auto' | 'default' | 'move') => {
    this.canvasStack.style.cursor = cursor;
    this.wrapperRef.style.cursor = cursor;
  };

  constructor(
    private canvasStack: HTMLDivElement,
    private wrapperRef: HTMLDivElement
  ) {
    // UAジェスチャ（パン/ズーム/長押し右クリック等）を無効化
    this.wrapperRef.style.touchAction = 'none';
    (this.wrapperRef.style as any).msTouchAction = 'none';
    this.canvasStack.style.touchAction = 'none';
    (this.canvasStack.style as any).msTouchAction = 'none';

    // コンポジタ昇格して transform の適用を安定化
    this.canvasStack.style.willChange = 'transform';
    this.canvasStack.style.backfaceVisibility = 'hidden';

    const [isRunning, start, stop] = createRAF(
      targetFPS(() => {
        this.onRaf();
      }, 60)
    );
    this.rafRunning = isRunning;
    this.startRaf = start;
    this.stopRaf = stop;
  }

  static isDragKey(e: PointerEvent): boolean {
    return isMacOS() ? e.metaKey : e.ctrlKey;
  }

  static isDraggable(e: PointerEvent) {
    if (e.buttons === 4) {
      return true;
    }

    if (e.buttons === 1 && CanvasAreaInteract.isDragKey(e)) {
      if (isSelectionAvailable()) return false;
      // angle-snapped line
      if (toolStore.activeToolCategory === 'pen' || toolStore.activeToolCategory === 'eraser') {
        if (e.shiftKey) return false;
      }

      return true;
    }
    return false;
  }

  private handlePointerDown(e: PointerEvent) {
    const start = new Date().getTime();
    logger.debugLog(`handlePointerDown start`);
    this.lastPointX = e.clientX;
    this.lastPointY = e.clientY;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (e.pointerType === 'touch') {
      // タッチ
      if (this.pointers.size === 1) {
        this.wrapperRef.setPointerCapture(e.pointerId);
        setInteractStore('isDragging', true);
      } else if (this.pointers.size === 2) {
        for (const id of this.pointers.keys()) {
          this.wrapperRef.setPointerCapture(id);
        }
        this.wrapperRef.setPointerCapture(e.pointerId);
        // ピンチズームの開始時に距離を記録
        const [p0, p1] = Array.from(this.pointers.values());
        this.lastDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        this.lastAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        // 回転スナップ状態初期化
        this.rotationSnapper.onGestureStart(interactStore.rotation);

        // Initialize applied state for RAF-based updates
        this.lastAppliedDist = this.lastDist;
        this.lastAppliedAngle = this.lastAngle;
        this.lastAppliedMidX = (p0.x + p1.x) / 2;
        this.lastAppliedMidY = (p0.y + p1.y) / 2;
        this.pinchDirty = false;
        this.startRaf?.();
      }
    } else {
      // タッチ以外
      if (e.pointerType === 'mouse') {
        if (e.button === 3) {
          e.preventDefault();
          if (projectHistoryController.canUndo()) {
            projectHistoryController.undo();
          }
          return;
        } else if (e.button === 4) {
          e.preventDefault();
          if (projectHistoryController.canRedo()) {
            projectHistoryController.redo();
          }
          return;
        }
      }

      if (CanvasAreaInteract.isDraggable(e)) {
        this.wrapperRef.setPointerCapture(e.pointerId);
        setInteractStore('isDragging', true);
      }
    }
    const end = new Date().getTime();
    logger.debugLog(`handlePointerDown executed in ${end - start} ms`);
  }

  private handlePointerMove(e: PointerEvent) {
    const start = new Date().getTime();
    logger.debugLog(`handlePointerMove start`);
    this.lastPointX = e.clientX;
    this.lastPointY = e.clientY;

    this.updateCursor('auto');
    if (!this.pointers.has(e.pointerId)) {
      logger.debugWarn(`handlePointerMove cancelled because don't have current pointer`);
      return;
    }
    const prev = this.pointers.get(e.pointerId)!;
    const now = { x: e.clientX, y: e.clientY };

    if (e.pointerType === 'touch') {
      // タッチ
      if (this.pointers.size === 1 && interactStore.isDragging) {
        // 一本指のパン
        this.pointers.set(e.pointerId, now);
        const dx = now.x - prev.x,
          dy = now.y - prev.y;
        setOffset({
          x: interactStore.offset.x + dx,
          y: interactStore.offset.y + dy,
        });
        // updateTransform は CanvasArea の createEffect で自動実行
      } else if (this.pointers.size === 2) {
        // 2本指: 位置だけ更新し、実処理は RAF でまとめて行う
        this.pointers.set(e.pointerId, now);
        this.pinchDirty = true;
      }
    } else {
      // タッチ以外
      if (CanvasAreaInteract.isDraggable(e)) {
        this.pointers.set(e.pointerId, now);
        if (interactStore.isDragging) {
          const dx = e.clientX - prev.x;
          const dy = e.clientY - prev.y;
          setOffset({
            x: interactStore.offset.x + dx,
            y: interactStore.offset.y + dy,
          });
          // updateTransform は CanvasArea の createEffect で自動実行
          this.updateCursor('move');
        } else {
          this.updateCursor('auto');
        }
      } else {
        this.updateCursor('auto');
      }
    }
    const end = new Date().getTime();
    logger.debugLog(`handlePointerMove executed in ${end - start} ms`);
  }

  private handlePointerUp(e: PointerEvent) {
    this.lastPointX = e.clientX;
    this.lastPointY = e.clientY;

    this.pointers.delete(e.pointerId);
    this.wrapperRef.releasePointerCapture(e.pointerId);
    if (this.pointers.size < 2) {
      // 2本指ピンチ終了時にスナップ状態リセット
      this.rotationSnapper.onGestureEnd();
      this.pinchDirty = false;
      // 停止条件: 完全に指が離れたら RAF を止める（無駄なループを避ける）
      if (this.pointers.size === 0) {
        this.stopRaf?.();
      }
    }
    if (this.pointers.size === 0) {
      setInteractStore('isDragging', false);
      this.lastDist = 0;
    }
  }

  private handlePointerCancel(e: PointerEvent) {
    this.handlePointerUp(e);
  }

  private handleWheel(e: WheelEvent) {
    if (e.shiftKey) {
      const amount = globalConfig.editor.rotateDegreePerWheelScroll;
      if (e.deltaY > 0) {
        setRotation(interactStore.rotation + amount);
      } else {
        setRotation(interactStore.rotation - amount);
      }
      return;
    }

    this.zoom(e.deltaY, 1);
  }

  private zoom(deltaY: number, multiply: number): boolean {
    const referencedZoom = getReferencedZoom() ?? 1;
    const delta = (deltaY > 0 ? -interactStore.wheelZoomStep : interactStore.wheelZoomStep) * multiply;

    const zoomOld = interactStore.zoom;
    let zoomNew =
      Math.round((interactStore.zoom + interactStore.zoom * delta) * Math.pow(10, Consts.zoomPrecisionSignificantDigits)) /
      Math.pow(10, Consts.zoomPrecisionSignificantDigits);
    zoomNew = Math.min(Math.max(zoomNew, interactStore.zoomMin * referencedZoom), interactStore.zoomMax * referencedZoom);

    const rect = this.canvasStack.getBoundingClientRect();
    const canvasX = (this.lastPointX - rect.left) / zoomOld;
    const canvasY = (this.lastPointY - rect.top) / zoomOld;
    const zoomed = setZoom(zoomNew);

    if (!zoomed) return false;

    setOffset({
      x: interactStore.offset.x + canvasX * (zoomOld - zoomNew),
      y: interactStore.offset.y + canvasY * (zoomOld - zoomNew),
    });

    // updateTransform は CanvasArea の createEffect で自動実行
    return true;
  }

  private KEY_ZOOM_MULT = 1.3;

  private handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey) {
      if (e.key === '+') {
        // in
        this.zoom(-1, this.KEY_ZOOM_MULT);
      } else if (e.key === '-') {
        // out
        this.zoom(1, this.KEY_ZOOM_MULT);
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey) {
      if (e.key === '+') {
        // in
      } else if (e.key === '-') {
        // out
      }
    }
  }

  private onPointerDown = this.handlePointerDown.bind(this);
  private onPointerMove = this.handlePointerMove.bind(this);
  private onPointerUp = this.handlePointerUp.bind(this);
  private onPointerCancel = this.handlePointerCancel.bind(this);
  private onWheel = this.handleWheel.bind(this);
  private onKeyDown = this.handleKeyDown.bind(this);
  private onKeyUp = this.handleKeyUp.bind(this);

  public setInteractListeners() {
    this.removeInteractListeners();
    this.wrapperRef.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.wrapperRef.addEventListener('pointercancel', this.onPointerCancel);
    this.wrapperRef.addEventListener('wheel', this.onWheel);
    // keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    logger.debugLog('setInteractListeners done');
  }

  public removeInteractListeners() {
    this.wrapperRef.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.wrapperRef.removeEventListener('pointercancel', this.onPointerCancel);
    this.wrapperRef.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  // RAF コールバック: 最新の 2本指ピンチ状態を元に一回分の zoom / rotate / pan を適用
  private onRaf() {
    if (!this.pinchDirty) return; // 変更なし
    if (this.pointers.size !== 2) return; // 安全策

    const pts = Array.from(this.pointers.values());
    if (pts.length !== 2) return;
    const [p0, p1] = pts;

    // 現在値計算
    const distNew = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (this.lastAppliedDist === 0) this.lastAppliedDist = distNew; // 初期防御
    const scaleFact = distNew / this.lastAppliedDist;
    const zoomOld = interactStore.zoom;
    const newZoomRaw = zoomOld * scaleFact;

    // 中点
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    const prevMidX = this.lastAppliedMidX;
    const prevMidY = this.lastAppliedMidY;

    // 角度
    const angleNew = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const deltaRad = angleNew - this.lastAppliedAngle;
    const rotOldDeg = interactStore.rotation;
    const rotCandidateRaw = rotOldDeg + (deltaRad * 180) / Math.PI;
    const rotCandidate =
      Math.round(rotCandidateRaw * Math.pow(10, Consts.rotationPrecisionSignificantDigits)) / Math.pow(10, Consts.rotationPrecisionSignificantDigits);

    const rotProcessed = this.rotationSnapper.process(rotCandidate);

    setZoom(newZoomRaw);
    const zoomApplied = interactStore.zoom; // 丸め後

    // キャンバス座標へ変換
    const rect = this.canvasStack.getBoundingClientRect();
    const canvasMidX = (midX - rect.left) / zoomOld;
    const canvasMidY = (midY - rect.top) / zoomOld;

    const dxCanvas = midX - prevMidX;
    const dyCanvas = midY - prevMidY;

    setOffset({
      x: interactStore.offset.x + canvasMidX * (zoomOld - zoomApplied) + dxCanvas,
      y: interactStore.offset.y + canvasMidY * (zoomOld - zoomApplied) + dyCanvas,
    });
    setRotation(rotProcessed);

    // 状態更新
    this.lastAppliedDist = distNew;
    this.lastAppliedAngle = angleNew;
    this.lastAppliedMidX = midX;
    this.lastAppliedMidY = midY;
    this.pinchDirty = false;
  }
}

export default CanvasAreaInteract;
