import { decodeWebp, encodeWebp, gzipDeflate, gzipInflate, toUint8Array } from '@sledge-pdm/core';
import { bench, describe } from 'vitest';

interface Compression {
  encode: (buffer: Uint8Array, width: number, height: number) => Uint8Array;
  decode: (buffer: Uint8Array, width: number, height: number) => Uint8Array;
}

class WebpCompression implements Compression {
  encode(buffer: Uint8Array, width: number, height: number): Uint8Array {
    return encodeWebp(buffer, width, height);
  }
  decode(buffer: Uint8Array, width: number, height: number): Uint8Array {
    return toUint8Array(decodeWebp(buffer, width, height));
  }
}

class DeflateCompression implements Compression {
  encode(buffer: Uint8Array, _width: number, _height: number): Uint8Array {
    return gzipDeflate(buffer);
  }
  decode(buffer: Uint8Array, _width: number, _height: number): Uint8Array {
    return gzipInflate(buffer);
  }
}

const WIDTH = 1024;
const HEIGHT = 1024;

const seedBuffer = (len: number) => {
  const out = new Uint8Array(len);
  let x = 123456789;
  for (let i = 0; i < len; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    out[i] = x & 0xff;
  }
  return out;
};

const baseRaw = seedBuffer(WIDTH * HEIGHT * 4);
const dirtyRaw = baseRaw.slice();
for (let i = 0; i < dirtyRaw.length; i += 97) {
  dirtyRaw[i] ^= 0xff;
}

const roundtripTask = (compression: Compression): void => {
  const c1 = compression.encode(baseRaw, WIDTH, HEIGHT);
  compression.decode(c1, WIDTH, HEIGHT);
  const c2 = compression.encode(dirtyRaw, WIDTH, HEIGHT);
  compression.decode(c2, WIDTH, HEIGHT);
};

describe('codec_only:compression', () => {
  bench('webp', () => roundtripTask(new WebpCompression()));
  bench('deflate', () => roundtripTask(new DeflateCompression()));
});
