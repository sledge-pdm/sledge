import { Layer } from '~/models/layer/Layer';
import { layerAgentManager } from '~/routes/editor';
import LayerImageAgent from '../layer/image/LayerImageAgent';

type TextureSlot = {
  layerId: string;
  texture: WebGLTexture;
  unit: number;
  uniformLoc: WebGLUniformLocation;
  listenerKey: string;
};

export class TextureManager {
  private slots: TextureSlot[] = [];

  constructor(
    private gl: WebGLRenderingContext,
    private program: WebGLProgram,
    private maxLayers: number
  ) {
    // 部分更新のために1バイト整列
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
  }

  public getLayerIds = () => this.slots.map((s) => s.layerId);

  /**
   * すべてのスロットを廃棄し、渡されたレイヤー配列で再構築します。
   */
  public initSlots(layers: Layer[]) {
    this.dispose();
    layers.slice(0, this.maxLayers).forEach((layer, i) => {
      this.createSlot(i, layer);
    });
  }

  /**
   * 毎フレーム呼び出し。差分更新→drawLayerQuad(unit) の順で実行します。
   */
  public renderFrame(drawLayerQuad: (unit: number) => void) {
    this.slots.forEach((slot) => {
      const agent = layerAgentManager.getAgent(slot.layerId)!;
      this.gl.activeTexture(this.gl.TEXTURE0 + slot.unit);
      this.updateDirty(agent, slot.texture);
      drawLayerQuad(slot.unit);
    });
  }

  /**
   * スロット i に layer を登録・初期化します。
   * 既存の同じ unit スロットがあれば破棄してから再生成します。
   */
  public createSlot(i: number, layer: Layer) {
    // 既存 slot があれば clear
    this.clearSlot(i);

    const agent = layerAgentManager.getAgent(layer.id)!;
    const tex = this.gl.createTexture()!;
    const key = `webgl_${layer.id}`;

    // テクスチャ作成＆パラメータ設定
    this.gl.activeTexture(this.gl.TEXTURE0 + i);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    // uniform ロケーション
    const loc = this.gl.getUniformLocation(this.program, `u_textures[${i}]`)!;
    this.gl.uniform1i(loc, i);

    // フルアップロード
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      agent.getWidth(),
      agent.getHeight(),
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      agent.getBuffer()
    );

    // 差分更新リスナー登録
    const updateFn = () => this.updateDirty(agent, tex);
    agent.setOnImageChangeListener(key, updateFn);

    this.slots.push({
      layerId: layer.id,
      texture: tex,
      unit: i,
      uniformLoc: loc,
      listenerKey: key,
    });
  }

  /**
   * スロット i をクリアします（リスナー解除 + テクスチャ破棄）。
   */
  public clearSlot(i: number) {
    const idx = this.slots.findIndex((s) => s.unit === i);
    if (idx === -1) return;
    const slot = this.slots[idx];
    const agent = layerAgentManager.getAgent(slot.layerId)!;
    agent.removeOnImageChangeListener?.(slot.listenerKey);
    this.gl.deleteTexture(slot.texture);
    this.slots.splice(idx, 1);
  }

  /** 全スロットを破棄 */
  public dispose() {
    this.slots.forEach((slot) => {
      const agent = layerAgentManager.getAgent(slot.layerId)!;
      agent.removeOnImageChangeListener?.(slot.listenerKey);
      this.gl.deleteTexture(slot.texture);
    });
    this.slots = [];
  }

  /** 内部: 汚れたタイルだけを texSubImage2D で更新 */
  private updateDirty(agent: LayerImageAgent, tex: WebGLTexture) {
    const tm = agent.getTileManager();
    const dirty = tm.getDirtyTiles();
    if (dirty.length === 0) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);

    dirty.forEach((tile) => {
      const { row, column } = tile.getIndex();
      const x = column * tm.TILE_SIZE;
      const y = row * tm.TILE_SIZE;
      const w = Math.min(tm.TILE_SIZE, agent.getWidth() - x);
      const h = Math.min(tm.TILE_SIZE, agent.getHeight() - y);

      // 部分バッファ
      const sub = new Uint8ClampedArray(w * h * 4);
      for (let dy = 0; dy < h; dy++) {
        const start = ((y + dy) * agent.getWidth() + x) * 4;
        sub.set(agent.getBuffer().subarray(start, start + w * 4), dy * w * 4);
      }

      this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, x, y, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, sub);
    });

    tm.resetDirtyStates();
  }
}
