import { Layer } from '~/models/layer/Layer';
import { layerAgentManager } from '~/routes/editor';

export class TextureManager {
  private textures: WebGLTexture[] = [];
  private offscreenCanvases = new Map<string, HTMLCanvasElement>();
  public layerIds: string[] = [];

  constructor(
    private gl: WebGLRenderingContext,
    private program: WebGLProgram,
    private maxLayers: number
  ) {}

  setupInitialTextures(layers: Layer[]) {
    this.rebuildTextures(layers);
  }

  bindProgram(program: WebGLProgram) {
    this.program = program;
  }

  rebuildTextures(layers: Layer[]) {
    this.gl.useProgram(this.program);
    // --- 古いリスナー・テクスチャをクリーンアップ ---
    this.layerIds.forEach((id) => {
      const agent = layerAgentManager.getAgent(id);
      agent?.removeOnImageChangeListener?.(`webgl_${id}`);
      agent?.removeOnDrawingBufferChangeListener?.(`webgl_${id}`);
    });
    this.textures.forEach((tex) => this.gl.deleteTexture(tex));
    this.textures = [];
    this.offscreenCanvases.clear();
    this.layerIds = [];

    layers.slice(0, this.maxLayers).forEach((layer, i) => {
      const id = layer.id;
      this.layerIds.push(id);
      const agent = layerAgentManager.getAgent(id)!;
      const off = document.createElement('canvas');
      off.width = agent.getWidth();
      off.height = agent.getHeight();
      this.offscreenCanvases.set(id, off);
      const ctx = off.getContext('2d')!;
      agent.putImageIntoForce(ctx);

      const tex = this.gl.createTexture()!;
      this.textures.push(tex);
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, off);

      const loc = this.gl.getUniformLocation(this.program, `u_textures[${i}]`)!;
      this.gl.uniform1i(loc, i);

      const updateTex = () => {
        this.gl.activeTexture(this.gl.TEXTURE0 + i);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        agent.putImageIntoForce(ctx);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, off);
      };

      agent.setOnImageChangeListener(`webgl_${id}`, updateTex);
      agent.setOnDrawingBufferChangeListener(`webgl_${id}`, updateTex);
    });
  }

  resizeOffscreens(width: number, height: number, dpr: number) {
    this.layerIds.forEach((id, i) => {
      const off = this.offscreenCanvases.get(id)!;
      const agent = layerAgentManager.getAgent(id)!;
      off.width = width * dpr;
      off.height = height * dpr;
      const ctx = off.getContext('2d')!;
      agent.putImageIntoForce(ctx);

      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, off);
    });
  }

  /** スロット i に対して layer を（再）初期化 */
  createTextureSlot(i: number, layer: Layer) {
    const id = layer.id;
    const agent = layerAgentManager.getAgent(id)!;

    // オフスクリーンキャンバス準備
    let off = this.offscreenCanvases.get(id);
    if (!off) {
      off = document.createElement('canvas');
      this.offscreenCanvases.set(id, off);
    }
    off.width = agent.getWidth();
    off.height = agent.getHeight();
    const ctx = off.getContext('2d')!;
    agent.putImageIntoForce(ctx);

    // テクスチャ準備
    let tex = this.textures[i];
    if (!tex) {
      tex = this.gl.createTexture()!;
      this.textures[i] = tex;
    }
    this.gl.activeTexture(this.gl.TEXTURE0 + i);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, off);

    // uniform ロケーションはコントローラ側で一度取得しておく
    const loc = this.gl.getUniformLocation(this.program, `u_textures[${i}]`)!;
    this.gl.uniform1i(loc, i);

    // リスナ登録（既存 remove→set のみ簡略化）
    agent.removeOnImageChangeListener?.(`webgl_${id}`);
    agent.removeOnDrawingBufferChangeListener?.(`webgl_${id}`);
    const update = () => {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      agent.putImageIntoForce(ctx);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
      this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, off);
    };
    agent.setOnImageChangeListener(`webgl_${id}`, update);
    agent.setOnDrawingBufferChangeListener(`webgl_${id}`, update);

    this.layerIds[i] = id;
  }

  /** スロット i をクリア（完全透明化） */
  clearTextureSlot(i: number) {
    const transparent = new Uint8Array([0, 0, 0, 0]); // 1px 透明ピクセル
    this.gl.activeTexture(this.gl.TEXTURE0 + i);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, transparent);
    delete this.layerIds[i];
  }

  dispose() {
    this.layerIds.forEach((id) => {
      const agent = layerAgentManager.getAgent(id)!;
      agent.removeOnImageChangeListener?.(`webgl_${id}`);
      agent.removeOnDrawingBufferChangeListener?.(`webgl_${id}`);
    });
    this.textures.forEach((tex) => this.gl.deleteTexture(tex));
  }
}
