export function createShader(gl: WebGLRenderingContext, type: GLenum, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${msg}`);
  }
  return shader;
}

export function createProgramFromSources(
  gl: WebGLRenderingContext,
  vertexSrc: string,
  fragmentSrc: string
): WebGLProgram {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const msg = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${msg}`);
  }
  // shaders can be deleted after linking
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return program;
}

export function deleteProgramSafe(gl: WebGLRenderingContext, program: WebGLProgram) {
  gl.deleteProgram(program);
}
