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
