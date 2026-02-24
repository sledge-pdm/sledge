export const IMAGE_POOL_TRANSFER_300ES = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_src;
uniform sampler2D u_patch;
uniform vec2 u_canvas_size;
uniform vec2 u_patch_size;
uniform vec2 u_offset;
uniform vec2 u_scale;
uniform float u_rotate;
uniform vec2 u_flip;

void main() {
  vec4 dst = texture(u_src, v_uv);
  vec2 canvas = u_canvas_size;
  vec2 pt = u_patch_size;
  vec2 denom = max(pt - vec2(1.0), vec2(1.0));

  vec2 target;
  target.x = v_uv.x * (canvas.x - 1.0);
  target.y = (1.0 - v_uv.y) * (canvas.y - 1.0);

  vec2 rel = target - u_offset;
  vec2 src_center = (pt * u_scale) * 0.5;
  vec2 centered = rel - src_center;

  float cosr = cos(u_rotate);
  float sinr = sin(u_rotate);
  vec2 rotated = vec2(
    centered.x * cosr + centered.y * sinr,
    -centered.x * sinr + centered.y * cosr
  ) + src_center;

  vec2 src = rotated / u_scale;
  if (u_flip.x > 0.5) {
    src.x = (pt.x - 1.0) - src.x;
  }
  if (u_flip.y > 0.5) {
    src.y = (pt.y - 1.0) - src.y;
  }

  if (src.x < 0.0 || src.y < 0.0 || src.x >= pt.x || src.y >= pt.y) {
    outColor = dst;
    return;
  }

  vec2 uv = vec2(src.x / denom.x, 1.0 - (src.y / denom.y));
  vec4 srcColor = texture(u_patch, uv);

  float a = srcColor.a;
  outColor = vec4(
    srcColor.rgb * a + dst.rgb * (1.0 - a),
    a + dst.a * (1.0 - a)
  );
}
`;
