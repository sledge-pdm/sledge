import { bench, describe } from 'vitest';

import { rawToWebp as wasmRawToWebp, webpToRaw as wasmWebpToRaw } from '@sledge-pdm/core';
import { rawToWebp, setWasmImplementation, webpToRaw } from '~/utils/wasm';
import { rawToWebp as gzipRawToWebp, webpToRaw as gzipWebpToRaw } from '~/utils/wasm_js/buffer';

type ImplKind = 'wasm' | 'js';

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

const roundtripTask = (
  encode: (buffer: Uint8Array, width: number, height: number) => Uint8Array,
  decode: (buffer: Uint8Array, width: number, height: number) => Uint8Array
): void => {
  const c1 = encode(baseRaw, WIDTH, HEIGHT);
  decode(c1, WIDTH, HEIGHT);
  const c2 = encode(dirtyRaw, WIDTH, HEIGHT);
  decode(c2, WIDTH, HEIGHT);
};

// Tasks (bench only; results are not important)
// - Mixed impl roundtrip (wasm=webp, js=gzip).
// - Codec-only roundtrip (webp vs gzip).
const run = (impl: ImplKind): void => {
  setWasmImplementation(impl);
  roundtripTask(rawToWebp, webpToRaw);
};

describe('compression:mixed', () => {
  bench('wasm', () => run('wasm'));
  bench('js', () => run('js'));
});

describe('codec_only:compression', () => {
  bench('webp', () => roundtripTask(wasmRawToWebp, wasmWebpToRaw));
  bench('gzip', () => roundtripTask(gzipRawToWebp, gzipWebpToRaw));
});
