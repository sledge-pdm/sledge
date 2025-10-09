// src/renderer/WebGLRenderer.ts
import { calculate_texture_memory_usage, flip_pixels_vertically } from '@sledge/wasm';
import { getBaseLayerColor, getBlendModeId, Layer } from '~/features/layer';
import { clearDirtyTiles, getBufferPointer, getDirtyTiles } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { DebugLogger } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { layerListStore, setCanvasStore } from '~/stores/ProjectStores';
import fragmentSrc from './shaders/blend.frag.glsl';
import vertexSrc from './shaders/fullscreen.vert.glsl';

const MAX_LAYERS = 16;
const LOG_LABEL = 'WebGLRenderer';
const logger = new DebugLogger(LOG_LABEL, false);

const CHECK_ERROR = false;

function checkGLError(gl: WebGL2RenderingContext, operation: string): boolean {
  if (CHECK_ERROR) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      logger.debugError(`${operation} - ${error}`);
      return false;
    }
    return true;
  } else {
    return true;
  }
}

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private texArray!: WebGLTexture;
  private fullscreenQuadBuffer?: WebGLBuffer; // バッファの参照を保持
  private currentTextureDepth: number = 0; // 現在のテクスチャ配列の深度を追跡

  private uLayerCountLoc!: WebGLUniformLocation;
  private uOpacitiesLoc!: WebGLUniformLocation;
  private uBlendModesLoc!: WebGLUniformLocation;
  private uHasBaseLayerLoc!: WebGLUniformLocation;
  private uBaseLayerColorLoc!: WebGLUniformLocation;
  private disposed: boolean = false;

  private isChromium: boolean = false;

  private includeBaseLayer: boolean = true;

  constructor(
    private canvas: HTMLCanvasElement,
    private width: number = 0,
    private height: number = 0,
    private layers: Layer[] = []
  ) {
    const contextOptions: WebGLContextAttributes = {
      preserveDrawingBuffer: false,
      antialias: false,
      alpha: true,
      desynchronized: false,
      depth: true,
      stencil: false,
      premultipliedAlpha: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
    };

    const gl = canvas.getContext('webgl2', contextOptions);
    if (!gl) throw new Error('WebGL2 is not supported in this browser');
    this.gl = gl;

    if (import.meta.env.DEV) this.checkWebGLCapabilities(gl);

    this.isChromium = gl.getParameter(gl.VERSION).includes('Chromium');

    // --- シェーダコンパイル & プログラムリンク ---
    const vs = this.compileShader(gl.VERTEX_SHADER, vertexSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentSrc);
    const prog = gl.createProgram();
    if (!prog) throw new Error('Failed to create WebGL program');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog);
      throw new Error(`Program link failed: ${info}`);
    }
    this.program = prog;

    gl.useProgram(this.program);
    // sampler2DArray はユニット 0
    const loc = gl.getUniformLocation(this.program, 'u_texArray')!;
    gl.uniform1i(loc, 0);

    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    this.texArray = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texArray);

    checkGLError(gl, 'texture creation and binding');

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    checkGLError(gl, 'texture parameter setup');

    // --- フルスクリーンクワッド用 VAO ---
    this.vao = this.createFullscreenQuad();

    this.resize(width, height);

    this.uLayerCountLoc = this.gl.getUniformLocation(this.program, 'u_layerCount')!;
    this.uOpacitiesLoc = this.gl.getUniformLocation(this.program, 'u_opacities')!;
    this.uBlendModesLoc = this.gl.getUniformLocation(this.program, 'u_blendModes')!;
    this.uHasBaseLayerLoc = this.gl.getUniformLocation(this.program, 'u_hasBaseLayer')!;
    this.uBaseLayerColorLoc = this.gl.getUniformLocation(this.program, 'u_baseLayerColor')!;

    logger.debugLog('Initialized WebGLRenderer');
  }

  public setLayers(layers: Layer[]) {
    this.layers = [...layers];
  }

  public setIncludeBaseLayer(include: boolean) {
    this.includeBaseLayer = include;
  }

  public resize(width: number, height: number, checkActualBuffer: boolean = true): void {
    this.checkDisposed();
    if (width <= 0 || height <= 0) return;
    if (width === this.width && height === this.height) return;

    logger.debugLog(`Resizing canvas from ${this.width}x${this.height} to ${width}x${height}`);

    // 前回のメモリ使用量をログ出力
    if (this.currentTextureDepth > 0) {
      const oldMemory = calculate_texture_memory_usage(this.width, this.height, this.currentTextureDepth);
      logger.debugLog(`Releasing texture memory: ${(oldMemory / 1024 / 1024).toFixed(2)} MB`);
    }

    this.width = width;
    this.height = height;

    // キャンバスのサイズを設定
    this.canvas.width = width;
    this.canvas.height = height;

    // CSSスタイルも明示的に設定（必要に応じて）
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // ビューポートを設定
    this.gl.viewport(0, 0, width, height);

    if (checkActualBuffer) {
      // WebGLの描画バッファサイズを確認
      const actualWidth = this.gl.drawingBufferWidth;
      const actualHeight = this.gl.drawingBufferHeight;
      logger.debugLog(`📏 Canvas size set to: ${width}x${height}`);
      logger.debugLog(`📏 WebGL drawing buffer: ${actualWidth}x${actualHeight}`);

      if (actualWidth !== width || actualHeight !== height) {
        logger.debugWarn(`⚠️ WebGL drawing buffer size differs from requested size!`);
        logger.debugWarn(`   Requested: ${width}x${height}`);
        logger.debugWarn(`   Actual: ${actualWidth}x${actualHeight}`);

        // この場合、実際の描画バッファサイズを使用する
        if (actualWidth > 0 && actualHeight > 0) {
          logger.debugLog(`🔧 Using actual drawing buffer size: ${actualWidth}x${actualHeight}`);
          this.width = actualWidth;
          this.height = actualHeight;

          // 重要：すべてのレイヤーバッファもWebGLのサイズに合わせて調整
          const newSize = { width: actualWidth, height: actualHeight };
          logger.debugLog(`🔧 Resizing all layer buffers to match WebGL constraints: ${actualWidth}x${actualHeight}`);

          this.layers.forEach((layer) => {
            const anvil = getAnvilOf(layer.id);
            if (anvil) {
              try {
                anvil.resize(actualWidth, actualHeight); // offset なし resize
                logger.debugLog(`✅ Resized anvil layer buffer ${layer.id} to ${actualWidth}x${actualHeight}`);
              } catch (error) {
                logger.debugError(`❌ Failed to resize anvil layer buffer ${layer.id}:`, error);
              }
            }
          });

          // キャンバスストアも更新（他のコンポーネントとの整合性を保つため）
          setCanvasStore('canvas', newSize);
          logger.debugLog(`📝 Updated canvas store to: ${actualWidth}x${actualHeight}`);

          // ユーザーに分かりやすい警告メッセージを表示
          const maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
          logger.debugWarn(`⚠️ ========================= IMPORTANT WARNING =========================`);
          logger.debugWarn(`⚠️ Canvas size has been automatically reduced due to WebGL limitations:`);
          logger.debugWarn(`⚠️   Requested: ${width}x${height}`);
          logger.debugWarn(`⚠️   Actual: ${actualWidth}x${actualHeight}`);
          logger.debugWarn(`⚠️ This limitation is caused by WebGL memory constraint:`);
          logger.debugWarn(`⚠️   • Drawing buffer limited to 1/8 of MAX_TEXTURE_SIZE² (${maxTextureSize}²)`);
          logger.debugWarn(`⚠️   • Theoretical limit: ~5792 pixels per side`);
          logger.debugWarn(`⚠️   • Actual limit: ${actualWidth} pixels (with safety margin)`);
          logger.debugWarn(`⚠️   • Memory usage: ${((actualWidth * actualHeight * 4) / 1024 / 1024).toFixed(2)} MB`);
          logger.debugWarn(`⚠️ All layer buffers have been resized to match WebGL constraints.`);
          logger.debugWarn(`⚠️ ====================================================================`);
        }
      }
    }

    // // 実際に使用するレイヤー数のみ確保（最小1レイヤー）
    const activeLayers = this.layers.filter((l) => l.enabled);
    const requiredDepth = Math.max(1, Math.min(activeLayers.length, MAX_LAYERS));
    // // テクスチャ配列のサイズを更新
    this.updateTextureArraySize(requiredDepth, true);
  }

  public render(onlyDirty?: boolean): void {
    this.checkDisposed();
    if (this.width === 0 || this.height === 0) return;
    const layers = this.layers.toReversed().slice(0, MAX_LAYERS);

    logger.debugLog('🎨 WebGLRenderer.render() called:', {
      layerCount: layers.length,
      onlyDirty,
      dimensions: `${this.width}x${this.height}`,
    });

    const activeLayers = layers.filter((l) => l.enabled);

    logger.debugLog('🔍 Active layers:', activeLayers.length);

    // テクスチャ配列のサイズを動的に調整
    const requiredDepth = Math.max(1, activeLayers.length);
    this.updateTextureArraySize(requiredDepth);

    const { gl, program } = this;
    gl.useProgram(program);

    // テクスチャユニット0をアクティブにしてテクスチャ配列をバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texArray);

    checkGLError(gl, 'texture binding and activation');

    logger.debugLog('🖼️ Starting texture upload for', activeLayers.length, 'layers');

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    activeLayers.forEach((layer, i) => {
      logger.debugLog(`📄 Processing layer ${i}: ${layer.id}, enabled: ${layer.enabled}`);

      const anvil = getAnvilOf(layer.id);
      const buf =
        layer.id === layerListStore.activeLayerId && floatingMoveManager.isMoving()
          ? floatingMoveManager.getPreviewBuffer()
          : getBufferPointer(layer.id);
      if (!buf) return;

      // バッファサイズの整合性をチェック
      const expectedSize = this.width * this.height * 4;
      const actualSize = buf.length;

      logger.debugLog(`📊 Buffer info: length=${buf.length}, expected=${expectedSize}`);

      if (actualSize !== expectedSize) {
        logger.debugWarn(`⚠️ Buffer size mismatch! Layer ${layer.id}:`);
        logger.debugWarn(`   Expected: ${expectedSize} bytes (${this.width}x${this.height}x4)`);
        logger.debugWarn(`   Actual: ${actualSize} bytes`);

        // バッファサイズから元のサイズを推定
        const bufferPixels = actualSize / 4;
        const bufferSide = Math.sqrt(bufferPixels);
        logger.debugWarn(`   Buffer appears to be: ${bufferSide}x${bufferSide}`);

        // バッファサイズが期待値と異なる場合、安全のためフルアップデートをスキップ
        logger.debugError(`❌ Skipping layer ${i} due to buffer size mismatch`);
        return;
      }

      const dirtyTiles = getDirtyTiles(layer.id);
      if (onlyDirty && dirtyTiles.length !== 0) {
        logger.debugLog(`🔧 Processing ${dirtyTiles.length} dirty tiles for layer ${i}`);
        dirtyTiles.forEach((tile) => {
          const tileSize = anvil?.getTileSize() ?? 0;
          const col = (tile as any).col;
          const row = (tile as any).row;
          const ox = col * tileSize;
          const oy = row * tileSize;
          const w = Math.min(this.width - ox, tileSize);
          const h = Math.min(this.height - oy, tileSize);

          // フォールバック: 元のJavaScript実装
          const tileByteLength = w * h * 4;
          const tileBuffer = new Uint8Array(tileByteLength);
          for (let dy = 0; dy < h; dy++) {
            const srcStart = ((oy + dy) * this.width + ox) * 4;
            const dstStart = dy * w * 4;
            tileBuffer.set(buf.subarray(srcStart, srcStart + w * 4), dstStart);
          }

          // macOSでのWebGLエラーをチェック
          checkGLError(gl, `before texSubImage3D tile upload layer ${i}`);

          gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, ox, oy, i, w, h, 1, gl.RGBA, gl.UNSIGNED_BYTE, tileBuffer);

          if (!checkGLError(gl, `texSubImage3D tile upload layer ${i}, pos(${ox},${oy}), size(${w},${h})`)) {
            logger.debugError(
              LOG_LABEL,
              `Tile upload failed: layer=${i}, offset=(${ox},${oy}), size=(${w},${h}), buffer.length=${tileBuffer.length}`
            );
          }
        });
      } else {
        logger.debugLog(`📤 Full upload for layer ${i}`);

        // macOSでのWebGLエラーをチェック
        checkGLError(gl, `before full texSubImage3D upload layer ${i}`);

        // フルアップデート
        gl.texSubImage3D(
          gl.TEXTURE_2D_ARRAY,
          0,
          0,
          0,
          i, // x, y, layer index
          this.width,
          this.height,
          1, // depth = 1 (１レイヤー分)
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          buf
        );

        if (!checkGLError(gl, `full texSubImage3D upload layer ${i}, size(${this.width},${this.height})`)) {
          logger.debugError(`Full upload failed: layer=${i}, size=(${this.width},${this.height}), buffer.length=${buf.length}`);
        }

        // フルアップロード後は dirty フラグをクリア (patch 経由でない更新ケース)
        clearDirtyTiles(layer.id);
      }
    });

    const opacities = new Float32Array(MAX_LAYERS);
    const blendModes = new Int32Array(MAX_LAYERS);
    activeLayers.forEach((layer, i) => {
      opacities[i] = layer.opacity;
      blendModes[i] = getBlendModeId(layer.mode);
    });

    logger.debugLog('🎛️ Setting uniforms:', {
      layerCount: activeLayers.length,
      opacities: Array.from(opacities.slice(0, activeLayers.length)),
      blendModes: Array.from(blendModes.slice(0, activeLayers.length)),
    });

    checkGLError(gl, 'before setting uniforms');

    gl.uniform1i(this.uLayerCountLoc, activeLayers.length);
    checkGLError(gl, 'after setting layer count uniform');

    gl.uniform1fv(this.uOpacitiesLoc, opacities);
    checkGLError(gl, 'after setting opacities uniform');

    gl.uniform1iv(this.uBlendModesLoc, blendModes);
    checkGLError(gl, 'after setting blend modes uniform');

    if (this.includeBaseLayer) {
      // ベースレイヤーの設定
      const baseLayer = layerListStore.baseLayer;
      gl.uniform1i(this.uHasBaseLayerLoc, 1);

      const baseColor = getBaseLayerColor(baseLayer);
      // ベースレイヤーの不透明度も考慮
      const finalColor = [baseColor[0], baseColor[1], baseColor[2], baseColor[3]];
      gl.uniform4f(this.uBaseLayerColorLoc, finalColor[0], finalColor[1], finalColor[2], finalColor[3]);
      logger.debugLog('🎨 Base layer color:', finalColor, 'mode:', baseLayer.colorMode);
    } else {
      // ベースを使わない
      this.gl.uniform1i(this.uHasBaseLayerLoc, 0);
      // u_baseLayerColor は未使用だが0を入れておく
      this.gl.uniform4f(this.uBaseLayerColorLoc, 0, 0, 0, 0);
      logger.debugLog('🎨 Base layer disabled for this render');
    }

    checkGLError(gl, 'after setting base layer uniforms');

    // フルスクリーンクワッドを描画
    logger.debugLog(`🖌️ Drawing fullscreen quad...`);

    checkGLError(gl, 'before binding VAO');
    gl.bindVertexArray(this.vao);
    checkGLError(gl, 'after binding VAO');

    checkGLError(gl, 'before drawArrays');
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    checkGLError(gl, 'after drawArrays');

    // WebGLエラーをチェック
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      logger.debugError('❌ WebGL Error:', error);
    } else {
      logger.debugLog(`✅ Render completed successfully`);
    }
  }

  public isDisposed(): boolean {
    return this.disposed;
  }

  /** シェーダをコンパイルするユーティリティ */
  private compileShader(type: GLenum, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }

  /** フルスクリーンクワッド用 VAO を作成 */
  private createFullscreenQuad(): WebGLVertexArrayObject {
    const { gl, program } = this;
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('Failed to create VAO');
    gl.bindVertexArray(vao);

    let vertices: Float32Array;
    if (this.isChromium) {
      // Chromium系ブラウザでは最適化されたフルスクリーンクワッドを使用
      vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    } else {
      vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
    }

    const buf = gl.createBuffer();
    if (!buf) throw new Error('Failed to create buffer');

    // バッファの参照を保持してdisposeで削除できるようにする
    this.fullscreenQuadBuffer = buf;

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_pos');
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    } else {
      logger.debugWarn('Attribute a_pos not found in shader program');
    }

    checkGLError(gl, 'fullscreen quad VAO setup');

    gl.bindVertexArray(null);
    return vao;
  }

  readPixelsAsBuffer(): Uint8ClampedArray {
    const gl = this.gl;

    logger.debugLog(`📖 Reading pixels as buffer: ${this.width}x${this.height}`);

    this.render(false); // フルアップデート

    // ビューポートサイズを確認
    const viewport = gl.getParameter(gl.VIEWPORT);
    logger.debugLog(`📏 Current viewport: [${viewport[0]}, ${viewport[1]}, ${viewport[2]}, ${viewport[3]}]`);

    // フレームバッファのサイズを確認
    const drawingBufferWidth = gl.drawingBufferWidth;
    const drawingBufferHeight = gl.drawingBufferHeight;
    logger.debugLog(`🖼️ Drawing buffer size: ${drawingBufferWidth}x${drawingBufferHeight}`);

    if (drawingBufferWidth !== this.width || drawingBufferHeight !== this.height) {
      logger.debugWarn(
        LOG_LABEL,
        `⚠️ Drawing buffer size mismatch! Expected: ${this.width}x${this.height}, Actual: ${drawingBufferWidth}x${drawingBufferHeight}`
      );
    }

    // ① WebGL の描画バッファが現在の描画結果を保持している前提で、
    //    gl.readPixels() ですぐにピクセルデータを取得する。
    //    （※たとえば export ボタンを押した直後に呼べば、次のクリア前の状態を取れる）
    const pixels = new Uint8Array(this.width * this.height * 4);

    try {
      gl.readPixels(
        0, // x
        0, // y
        this.width,
        this.height,
        gl.RGBA, // フォーマット
        gl.UNSIGNED_BYTE,
        pixels // 読み取り先バッファ
      );

      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        logger.debugError(`❌ readPixels failed with error: ${error} (0x${error.toString(16)})`);
      } else {
        logger.debugLog(`✅ readPixels successful: ${pixels.length} bytes read`);
      }
    } catch (e) {
      logger.debugError('❌ Exception during readPixels:', e);
    }

    return new Uint8ClampedArray(pixels.buffer);
  }

  public readPixelsFlipped(): Uint8ClampedArray {
    const gl = this.gl;
    const w = this.width;
    const h = this.height;

    // (1) フルアップデート → ピクセル読み取り
    this.render(false);
    this.gl.finish?.();
    const raw = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, raw);

    // (2) WASM関数を使った高速な上下反転
    const flipped = new Uint8Array(raw);
    flip_pixels_vertically(flipped, w, h);

    return new Uint8ClampedArray(flipped.buffer);
  }

  /**
   * 現在のフレームバッファをそのまま読み出す（上下反転なし、再レンダリングなし）
   */
  public readPixelsRaw(): Uint8ClampedArray {
    this.checkDisposed();
    const gl = this.gl;
    const w = this.width;
    const h = this.height;

    const raw = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, raw);
    return new Uint8ClampedArray(raw.buffer);
  }

  /**
   * WebGLリソースを適切に開放する
   */
  public dispose(): void {
    if (this.disposed) return;

    const gl = this.gl;

    // テクスチャを削除
    if (this.texArray) {
      gl.deleteTexture(this.texArray);
      logger.debugLog('WebGL texture array disposed');
    }

    // プログラムを削除
    if (this.program) {
      gl.deleteProgram(this.program);
      logger.debugLog('WebGL program disposed');
    }

    // VAOを削除
    if (this.vao) {
      gl.deleteVertexArray(this.vao);
      logger.debugLog('WebGL VAO disposed');
    }

    // バッファを削除
    if (this.fullscreenQuadBuffer) {
      gl.deleteBuffer(this.fullscreenQuadBuffer);
      logger.debugLog('WebGL buffer disposed');
    }

    this.disposed = true;
    logger.debugLog('WebGL renderer disposed completely');
  }

  /**
   * disposeされているかチェックし、disposeされていたら例外を投げる
   */
  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('WebGLRenderer has been disposed');
    }
  }

  /**
   * テクスチャ配列のサイズを動的に調整する
   */
  private updateTextureArraySize(requiredDepth: number, force?: boolean): void {
    if (requiredDepth === this.currentTextureDepth && !force) return;
    let oldDepth = this.currentTextureDepth;
    this.currentTextureDepth = requiredDepth;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texArray);

    logger.debugLog(`🔄 Updating texture array: ${this.width}x${this.height}x${requiredDepth} (was ${oldDepth})`);

    checkGLError(gl, `before texImage3D resize to depth ${requiredDepth}`);

    // より詳細なエラーチェックを追加
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxTextureLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);

    if (this.width > maxTextureSize || this.height > maxTextureSize) {
      logger.debugError(`❌ Texture size (${this.width}x${this.height}) exceeds MAX_TEXTURE_SIZE (${maxTextureSize})`);
    }

    if (requiredDepth > maxTextureLayers) {
      logger.debugError(`❌ Required depth (${requiredDepth}) exceeds MAX_ARRAY_TEXTURE_LAYERS (${maxTextureLayers})`);
    }

    try {
      gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0, // level
        gl.RGBA8, // 内部フォーマット（WebGL2）
        this.width,
        this.height,
        this.currentTextureDepth, // 新しいレイヤー数
        0, // border (must be 0)
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );

      const error = gl.getError();
      if (error === gl.NO_ERROR) {
        logger.debugLog(`✅ Texture array resize successful: ${this.width}x${this.height}x${requiredDepth}`);
      } else {
        logger.debugError(`❌ Texture array resize failed with WebGL error: ${error} (0x${error.toString(16)})`);

        // エラーの詳細分析
        switch (error) {
          case gl.INVALID_VALUE:
            logger.debugError('  → INVALID_VALUE: One or more parameters are invalid');
            logger.debugError(`    Width: ${this.width}, Height: ${this.height}, Depth: ${this.currentTextureDepth}`);
            break;
          case gl.INVALID_OPERATION:
            logger.debugError('  → INVALID_OPERATION: Operation not allowed in current state');
            break;
          case gl.OUT_OF_MEMORY:
            logger.debugError('  → OUT_OF_MEMORY: Insufficient memory for texture');
            const estimatedMemory = (this.width * this.height * 4 * this.currentTextureDepth) / 1024 / 1024;
            logger.debugError(`    Estimated memory needed: ${estimatedMemory.toFixed(2)} MB`);
            break;
        }
      }
    } catch (e) {
      logger.debugError('❌ Exception during texture array resize:', e);
    }

    if (!checkGLError(gl, `texImage3D resize to depth ${requiredDepth}, size(${this.width},${this.height})`)) {
      logger.debugError(`Texture array resize failed: depth=${requiredDepth}, size=(${this.width},${this.height})`);
    }

    // WASM関数を使ったメモリ使用量計算
    const oldMemory = calculate_texture_memory_usage(this.width, this.height, oldDepth);
    const newMemory = calculate_texture_memory_usage(this.width, this.height, requiredDepth);

    logger.debugLog(`🔄 Resizing texture array from ${oldDepth} to ${requiredDepth} layers`);
    logger.debugLog(`📊 Memory change: ${(oldMemory / 1024 / 1024).toFixed(2)} MB → ${(newMemory / 1024 / 1024).toFixed(2)} MB`);
  }

  private checkWebGLCapabilities(gl: WebGL2RenderingContext): void {
    logger.debugLog('🔍 WebGL2 Capabilities Check:');
    logger.debugLog('Vendor:', gl.getParameter(gl.VENDOR));
    logger.debugLog('Renderer:', gl.getParameter(gl.RENDERER));
    logger.debugLog('Version:', gl.getParameter(gl.VERSION));
    logger.debugLog('GLSL Version:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

    // テクスチャ配列の制限をチェック
    const maxTextureLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const max3DTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
    const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);

    logger.debugLog('Max Array Texture Layers:', maxTextureLayers);
    logger.debugLog('Max Texture Size:', maxTextureSize);
    logger.debugLog('Max 3D Texture Size:', max3DTextureSize);
    logger.debugLog('Max Renderbuffer Size:', maxRenderbufferSize);
    logger.debugLog('Max Viewport Dimensions:', maxViewportDims);

    // テクスチャメモリの推定チェック
    const memoryEstimate = (this.width * this.height * 4 * MAX_LAYERS) / 1024 / 1024;
    logger.debugLog(`Estimated texture memory usage: ${memoryEstimate.toFixed(2)} MB`);

    if (maxTextureLayers < MAX_LAYERS) {
      logger.debugWarn(`⚠️ System supports only ${maxTextureLayers} texture layers, but we need ${MAX_LAYERS}`);
    }

    // 大きなキャンバスサイズの警告
    if (this.width > maxTextureSize || this.height > maxTextureSize) {
      logger.debugError(`❌ Canvas size (${this.width}x${this.height}) exceeds WebGL MAX_TEXTURE_SIZE (${maxTextureSize})`);
    } else if (this.width > maxTextureSize * 0.8 || this.height > maxTextureSize * 0.8) {
      logger.debugWarn(`⚠️ Canvas size (${this.width}x${this.height}) is approaching WebGL MAX_TEXTURE_SIZE (${maxTextureSize})`);
    }

    // 現在のキャンバスサイズでのテクスチャ作成テストを実行
    this.testTextureCreation(gl, this.width, this.height);
  }

  public getMaxTextureSize(): number {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
  }

  /**
   * 指定されたサイズでテクスチャの作成が可能かテストする
   */
  private testTextureCreation(gl: WebGL2RenderingContext, width: number, height: number): void {
    if (width === 0 || height === 0) return;

    logger.debugLog(`🧪 Testing texture creation for size: ${width}x${height}`);

    // WebGLの制限値を詳細に調査
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    const maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    const maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    const maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);

    logger.debugLog(`🔍 Detailed WebGL limits analysis:`);
    logger.debugLog(`   MAX_TEXTURE_SIZE: ${maxTextureSize}`);
    logger.debugLog(`   MAX_RENDERBUFFER_SIZE: ${maxRenderbufferSize}`);
    logger.debugLog(`   MAX_VIEWPORT_DIMS: [${maxViewportDims[0]}, ${maxViewportDims[1]}]`);
    logger.debugLog(`   MAX_TEXTURE_IMAGE_UNITS: ${maxTextureImageUnits}`);
    logger.debugLog(`   MAX_FRAGMENT_UNIFORM_VECTORS: ${maxFragmentUniformVectors}`);
    logger.debugLog(`   MAX_VERTEX_UNIFORM_VECTORS: ${maxVertexUniformVectors}`);

    // メモリ関連の推定
    const estimatedMemory = (width * height * 4) / 1024 / 1024;
    logger.debugLog(`💾 Estimated memory for ${width}x${height} RGBA texture: ${estimatedMemory.toFixed(2)} MB`);

    // 5759という数値の謎を解明するための計算
    // 発見: 5759 ≈ sqrt(MAX_TEXTURE_SIZE² / 8) - 安全マージン
    // MAX_TEXTURE_SIZE² / 8 = 16384² / 8 = 33,554,432 pixels
    // sqrt(33,554,432) ≈ 5792.62 pixels per side
    // 実際の制限 5759 = 理論値 5792 - 安全マージン 33 pixels
    // これはWebGLが最大テクスチャメモリの1/8を描画バッファに割り当てているため
    const ratio5759 = 5759 / maxTextureSize;
    const sqrt5759 = Math.sqrt(5759);
    const pow2Near5759 = Math.pow(2, Math.floor(Math.log2(5759)));
    const theoreticalLimit = Math.sqrt((maxTextureSize * maxTextureSize) / 8);
    const safetyMargin = theoreticalLimit - 5759;

    logger.debugLog(`🔍 Analysis of 5759 limit (MEMORY CONSTRAINT DISCOVERED):`);
    logger.debugLog(`   5759 / MAX_TEXTURE_SIZE(${maxTextureSize}) = ${ratio5759.toFixed(4)}`);
    logger.debugLog(`   sqrt(5759) = ${sqrt5759.toFixed(2)}`);
    logger.debugLog(`   nearest power of 2 = ${pow2Near5759}`);
    logger.debugLog(`   5759^2 = ${(5759 * 5759).toLocaleString()} pixels`);
    logger.debugLog(`   5759^2 * 4 bytes = ${((5759 * 5759 * 4) / 1024 / 1024).toFixed(2)} MB`);
    logger.debugLog(`   🔍 THEORY: sqrt(MAX_TEXTURE_SIZE² / 8) = ${theoreticalLimit.toFixed(2)}`);
    logger.debugLog(`   🔍 SAFETY MARGIN: ${theoreticalLimit.toFixed(2)} - 5759 = ${safetyMargin.toFixed(2)} pixels`);
    logger.debugLog(`   🔍 CONCLUSION: WebGL limits drawing buffer to 1/8 of max texture memory + safety margin`);

    // テスト用の一時的なテクスチャを作成
    const testTexture = gl.createTexture();
    if (!testTexture) {
      logger.debugError('❌ Failed to create test texture');
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, testTexture);

    // 最初にsmallなサイズで試してみる
    try {
      gl.texImage3D(
        gl.TEXTURE_2D_ARRAY,
        0, // level
        gl.RGBA8,
        width,
        height,
        1, // 1レイヤーで試す
        0, // border
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );

      const error = gl.getError();
      if (error === gl.NO_ERROR) {
        logger.debugLog(`✅ Test texture creation successful for ${width}x${height}`);
      } else {
        logger.debugError(`❌ Test texture creation failed with error: ${error} (0x${error.toString(16)})`);

        // エラーコードの詳細説明
        switch (error) {
          case gl.INVALID_VALUE:
            logger.debugError('  → INVALID_VALUE: Width, height, or depth parameters are invalid');
            break;
          case gl.INVALID_OPERATION:
            logger.debugError('  → INVALID_OPERATION: Operation is not allowed in current state');
            break;
          case gl.OUT_OF_MEMORY:
            logger.debugError('  → OUT_OF_MEMORY: Not enough memory available');
            break;
          default:
            logger.debugError(`  → Unknown error code: ${error}`);
        }
      }
    } catch (e) {
      logger.debugError('❌ Exception during test texture creation:', e);
    } finally {
      // テスト用テクスチャを削除
      gl.deleteTexture(testTexture);
    }
  }
}
