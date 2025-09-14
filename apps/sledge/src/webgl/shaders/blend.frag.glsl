#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp int;

in  vec2 v_uv;
out vec4 outColor;

// 1 枚のテクスチャアレイを使う
uniform sampler2DArray u_texArray;
uniform int            u_layerCount;
uniform float          u_opacities[16];
uniform int            u_blendModes[16];

// ベースレイヤーの色情報
uniform bool           u_hasBaseLayer;
uniform vec4           u_baseLayerColor;


float blendAlpha(float s, float d) {
  return s + d * (1.0 - s);
}
vec3 blendNormalRGB(vec3 src, vec3 dst) {
  return src;
}
vec3 blendAddRGB(vec3 src, vec3 dst) {
  return min(src + dst, 1.0);
}
vec3 blendMultiplyRGB(vec3 src, vec3 dst) {
  return src * dst;
}
vec3 blendScreenRGB(vec3 src, vec3 dst) {
  return 1.0 - (1.0 - src) * (1.0 - dst);
}
vec3 blendOverlayRGB(vec3 src, vec3 dst) {
  return mix(2.0 * src * dst, 1.0 - 2.0 * (1.0 - src) * (1.0 - dst), step(0.5, dst));
}
vec3 blendSoftLightRGB(vec3 src, vec3 dst) {
  return mix(
    2.0 * src * dst + src * src * (1.0 - 2.0 * dst),
    sqrt(src) * (2.0 * dst - 1.0) + 2.0 * src * (1.0 - dst),
    step(0.5, dst)
  );
}
vec3 blendHardLightRGB(vec3 src, vec3 dst) {
  return blendOverlayRGB(dst, src);
}
vec3 blendLinearLightRGB(vec3 src, vec3 dst) {
  return clamp(src + 2.0 * dst - 1.0, 0.0, 1.0);
}
vec3 blendVividLightRGB(vec3 src, vec3 dst) {
  vec3 result;
  for (int i = 0; i < 3; ++i) {
    if (src[i] < 0.5) {
      result[i] = 1.0 - (1.0 - dst[i]) / max(2.0 * src[i], 1e-5);
    } else {
      result[i] = dst[i] / max(2.0 * (1.0 - src[i]), 1e-5);
    }
    result[i] = clamp(result[i], 0.0, 1.0);
  }
  return result;
}

vec4 blendNormal(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + src.rgb * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendAdd(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendAddRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendMultiply(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendMultiplyRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendScreen(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendScreenRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendOverlay(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendOverlayRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendSoftLight(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendSoftLightRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendHardLight(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendHardLightRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendLinearLight(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendLinearLightRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}
vec4 blendVividLight(vec4 src, vec4 dst) {
  float Sa = src.a;
  vec3 rgb = dst.rgb * (1.0 - Sa) + blendVividLightRGB(src.rgb, dst.rgb) * Sa;
  return vec4(rgb, blendAlpha(Sa, dst.a));
}

void main() {
  // ベースレイヤーがある場合はその色を、ない場合は最初のレイヤーから開始
  vec4 dst;
  int startLayer;
  
  if (u_hasBaseLayer) {
    dst = u_baseLayerColor;
    startLayer = 0;
  } else {
    dst = texture(u_texArray, vec3(v_uv, 0.0)) * u_opacities[0];
    startLayer = 1;
  }

  for (int i = startLayer; i < u_layerCount; ++i) {
    vec4 src = texture(u_texArray, vec3(v_uv, float(i))) * u_opacities[i];
    int mode = u_blendModes[i];
    if (mode == 1) {
      dst = blendMultiply(src, dst);
    } else if (mode == 2) {
      dst = blendAdd(src, dst);
    } else if (mode == 3) {
      dst = blendScreen(src, dst);
    } else if (mode == 4) {
      dst = blendOverlay(src, dst);
    } else if (mode == 5) {
      dst = blendSoftLight(src, dst);
    } else if (mode == 6) {
      dst = blendHardLight(src, dst);
    } else if (mode == 7) {
      dst = blendLinearLight(src, dst);
    } else if (mode == 8) {
      dst = blendVividLight(src, dst);
    } else {
      dst = blendNormal(src, dst);
    }
  }

  outColor = dst;
}
