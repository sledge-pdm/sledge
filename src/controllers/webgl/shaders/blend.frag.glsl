#version 300 es
precision mediump float;
precision mediump sampler2DArray;
precision mediump int;

in  vec2 v_uv;
out vec4 outColor;

// 1 枚のテクスチャアレイを使う
uniform sampler2DArray u_texArray;
uniform int            u_layerCount;
uniform float          u_opacities[16];
uniform int            u_blendModes[16];

float blendAlpha(float s, float d) {
  return s + d * (1.0 - s);
}
vec4 blendNormal(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3  rgb = dst.rgb * (1.0 - Sa) + src.rgb * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendMultiply(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3  m   = dst.rgb * src.rgb;
  vec3  rgb = dst.rgb * (1.0 - Sa) + m * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}

void main() {
  // base
  vec4 dst = texture(u_texArray, vec3(v_uv, 0.0)) * u_opacities[0];

  for (int i = 1; i < u_layerCount; ++i) {
    // 3rd 成分にレイヤー番号を渡す
    vec4 src = texture(u_texArray, vec3(v_uv, float(i)))
               * u_opacities[i];
    if (u_blendModes[i] == 1) {
      dst = blendMultiply(src, dst);
    } else {
      dst = blendNormal(src, dst);
    }
  }

  outColor = dst;
}
