
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  vec2 flip_a_uv = vec2(a_uv.x, 1.0 - a_uv.y);
  v_uv = flip_a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
