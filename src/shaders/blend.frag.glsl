
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_textures[16];
uniform int u_activeCount;
uniform float u_opacities[16];
uniform int u_blendModes[16];
void main() {
  // １枚目はベースとして読み込み
  vec4 dst = texture2D(u_textures[0], v_uv) * u_opacities[0];

  for (int i = 1; i < 16; ++i) {
    if (i >= u_activeCount) break;
    vec4 src = texture2D(u_textures[i], v_uv) * u_opacities[i];

    if (u_blendModes[i] == 0) {
      // --- Normal blending ---
      float Sa = src.a;
      // new alpha
      float outA = Sa + dst.a * (1.0 - Sa);
      // new rgb
      vec3 outRGB = dst.rgb * (1.0 - Sa) + src.rgb * Sa;
      dst = vec4(outRGB, outA);
    }
    else if (u_blendModes[i] == 1) {
      // --- Multiply blending (透明度考慮版) ---
      float Sa = src.a;
      vec3  mulRGB = dst.rgb * src.rgb;
      float outA  = Sa + dst.a * (1.0 - Sa);
      // RGBはαで補間
      vec3 outRGB = dst.rgb * (1.0 - Sa) + mulRGB * Sa;
      dst = vec4(outRGB, outA);
    }
  }

  // 最後に「下地が完全不透明なら」常に1.0にしても良い
  // dst.a = 1.0;

  gl_FragColor = dst;
}
