export function setPixel(image: ImageData, x: number, y: number, r: number, g: number, b: number, a: number) {
  if (x < 0 || x >= image.width || y < 0 || y >= image.height) return;
  const i = (y * image.width + x) * 4;
  image.data[i + 0] = r;
  image.data[i + 1] = g;
  image.data[i + 2] = b;
  image.data[i + 3] = a;
}

export function encodeImageData(imageData: ImageData): string {
  const bytes = new Uint8Array(imageData.data.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary); // Base64 encode
}

export function decodeImageData(encoded: string, width: number, height: number): ImageData {
  const binary = atob(encoded);
  const buffer = new Uint8ClampedArray(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new ImageData(buffer, width, height);
}
