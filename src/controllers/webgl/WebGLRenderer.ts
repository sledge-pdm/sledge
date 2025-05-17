// src/renderer/WebGLRenderer.ts
import { BlendMode, Layer } from '~/models/layer/Layer';
import fragmentSrc from '~/shaders/blend.frag.glsl';
import vertexSrc from '~/shaders/fullscreen.vert.glsl';
import { getBufferOf } from '../layer/LayerAgentManager';

const MAX_LAYERS = 16;

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private texArray!: WebGLTexture;

  private uLayerCountLoc!: WebGLUniformLocation;
  private uOpacitiesLoc!: WebGLUniformLocation;
  private uBlendModesLoc!: WebGLUniformLocation;

  constructor(
    private canvas: HTMLCanvasElement,
    private width: number = 0,
    private height: number = 0
  ) {
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 is not supported in this browser');
    this.gl = gl;

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
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // --- フルスクリーンクワッド用 VAO ---
    this.vao = this.createFullscreenQuad();

    this.resize(width, height);

    this.uLayerCountLoc = this.gl.getUniformLocation(this.program, 'u_layerCount')!;
    this.uOpacitiesLoc = this.gl.getUniformLocation(this.program, 'u_opacities')!;
    this.uBlendModesLoc = this.gl.getUniformLocation(this.program, 'u_blendModes')!;
  }

  public resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texArray);
    gl.texImage3D(
      gl.TEXTURE_2D_ARRAY,
      0, // level
      gl.RGBA8, // 内部フォーマット（WebGL2）
      width,
      height,
      MAX_LAYERS, // depth = レイヤー数
      0, // border (must be 0)
      gl.RGBA, // format
      gl.UNSIGNED_BYTE,
      null // null で空領域確保
    );
  }

  /**
   * レイヤー配列を受け取って GPU 合成 & 描画
   * @param layers 並び順：0 が最背面
   */
  public render(layers: Layer[] | Layer): void {
    if (this.width === 0 || this.height === 0) return;
    if (!Array.isArray(layers)) layers = [layers];

    layers = layers.toReversed().slice(0, MAX_LAYERS);
    const activeLayers = layers.filter((l) => l.enabled);

    const { gl, program, vao } = this;
    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texArray);
    activeLayers.forEach((layer, i) => {
      const buf = getBufferOf(layer.id)!;
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
    });

    const opacities = new Float32Array(MAX_LAYERS);
    const blendModes = new Int32Array(MAX_LAYERS);
    activeLayers.forEach((layer, i) => {
      opacities[i] = layer.opacity;
      blendModes[i] = layer.mode === BlendMode.multiply ? 1 : 0;
    });
    gl.uniform1i(this.uLayerCountLoc, activeLayers.length);
    gl.uniform1fv(this.uOpacitiesLoc, opacities);
    gl.uniform1iv(this.uBlendModesLoc, blendModes);

    // フルスクリーンクワッドを描画
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
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

    // クリップ空間上で全画面を覆う三角形１つ（最適化版）
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buf = gl.createBuffer();
    if (!buf) throw new Error('Failed to create buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_pos');
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    }

    gl.bindVertexArray(null);
    return vao;
  }
}
