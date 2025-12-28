#version 300 es
precision mediump float;

in  vec2 a_pos;
out vec2 v_uv;

void main(){
  vec2 uv = a_pos * 0.5 + 0.5;    // (-1→0, +1→1)
  v_uv = vec2(uv.x, 1.0 - uv.y);  // Y を反転
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
