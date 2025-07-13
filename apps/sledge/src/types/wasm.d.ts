// WASM関数の型定義をオーバーライド
declare module '@sledge/wasm' {
  export function greet(name: string): void;
  export function convert_to_grayscale(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number): void;
  export function apply_gaussian_blur(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number, radius: number): void;
}
