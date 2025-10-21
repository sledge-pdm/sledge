let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
 * 選択範囲マスクからSVGパス文字列を生成
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {number} offset_x
 * @param {number} offset_y
 * @returns {string}
 */
export function mask_to_path(mask, width, height, offset_x, offset_y) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mask_to_path(ptr0, len0, width, height, offset_x, offset_y);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * しきい値付きの自動選択（領域抽出）
 * 入力バッファは RGBA 連続の &[u8]。変更せず、選択マスク(幅*高さ, 0/1)を返す。
 * @param {Uint8Array} buffer
 * @param {number} width
 * @param {number} height
 * @param {number} start_x
 * @param {number} start_y
 * @param {number} threshold
 * @param {number} _connectivity
 * @returns {Uint8Array}
 */
export function auto_select_region_mask(buffer, width, height, start_x, start_y, threshold, _connectivity) {
    const ptr0 = passArray8ToWasm0(buffer, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.auto_select_region_mask(ptr0, len0, width, height, start_x, start_y, threshold, _connectivity);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * Extract RGBA pixels from `source` where `mask` (1 byte per pixel) is zero.
 * - `source`: RGBA buffer (width=source_width, height=source_height)
 * - `mask`: 1 byte per pixel (0 or 1), dimensions `mask_width` x `mask_height`
 * - `mask_offset_x/y`: where to sample from the source for mask(0,0)
 * Returns an RGBA buffer sized `source_width * source_height * 4`, where selected pixels are fully transparent.
 * @param {Uint8Array} source
 * @param {number} source_width
 * @param {number} source_height
 * @param {Uint8Array} mask
 * @param {number} mask_width
 * @param {number} mask_height
 * @param {number} mask_offset_x
 * @param {number} mask_offset_y
 * @returns {Uint8Array}
 */
export function crop_patch_rgba(source, source_width, source_height, mask, mask_width, mask_height, mask_offset_x, mask_offset_y) {
    const ptr0 = passArray8ToWasm0(source, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crop_patch_rgba(ptr0, len0, source_width, source_height, ptr1, len1, mask_width, mask_height, mask_offset_x, mask_offset_y);
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}

/**
 * @param {Uint8Array} buffer
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array}
 */
export function create_opacity_mask(buffer, width, height) {
    const ptr0 = passArray8ToWasm0(buffer, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.create_opacity_mask(ptr0, len0, width, height);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * マスク合成：OR演算 (add mode)
 * @param {Uint8Array} base_mask
 * @param {Uint8Array} preview_mask
 * @returns {Uint8Array}
 */
export function combine_masks_add(base_mask, preview_mask) {
    const ptr0 = passArray8ToWasm0(base_mask, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(preview_mask, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.combine_masks_add(ptr0, len0, ptr1, len1);
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}

/**
 * マスク合成：AND NOT演算 (subtract mode)
 * @param {Uint8Array} base_mask
 * @param {Uint8Array} preview_mask
 * @returns {Uint8Array}
 */
export function combine_masks_subtract(base_mask, preview_mask) {
    const ptr0 = passArray8ToWasm0(base_mask, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(preview_mask, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.combine_masks_subtract(ptr0, len0, ptr1, len1);
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}

/**
 * マスク合成：置換 (replace mode)
 * @param {Uint8Array} preview_mask
 * @returns {Uint8Array}
 */
export function combine_masks_replace(preview_mask) {
    const ptr0 = passArray8ToWasm0(preview_mask, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.combine_masks_replace(ptr0, len0);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * 矩形をマスクに描画
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {number} start_x
 * @param {number} start_y
 * @param {number} rect_width
 * @param {number} rect_height
 */
export function fill_rect_mask(mask, width, height, start_x, start_y, rect_width, rect_height) {
    var ptr0 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.fill_rect_mask(ptr0, len0, mask, width, height, start_x, start_y, rect_width, rect_height);
}

/**
 * マスクオフセット適用（commitOffset用）
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {number} offset_x
 * @param {number} offset_y
 * @returns {Uint8Array}
 */
export function apply_mask_offset(mask, width, height, offset_x, offset_y) {
    const ptr0 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.apply_mask_offset(ptr0, len0, width, height, offset_x, offset_y);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}
/**
 * 選択範囲制限モードに応じてピクセルバッファをフィルタリングする
 * original_buffer: 元のピクセルバッファ (RGBA)
 * selection_mask: 選択範囲のマスク (0 or 1)
 * mode: 制限モード ("inside", "outside", "none")
 * width, height: 画像のサイズ
 *
 * "inside": 選択範囲外を透明化
 * "outside": 選択範囲内を透明化
 * "none": 元のバッファをそのまま返す
 * @param {Uint8Array} original_buffer
 * @param {Uint8Array} selection_mask
 * @param {string} mode
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array}
 */
export function filter_by_selection_mask(original_buffer, selection_mask, mode, width, height) {
    const ptr0 = passArray8ToWasm0(original_buffer, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(selection_mask, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.filter_by_selection_mask(ptr0, len0, ptr1, len1, ptr2, len2, width, height);
    var v4 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v4;
}

/**
 * 2つのバッファを合成する（FloodFill結果を元のバッファに適用）
 * base_buffer: ベースとなるピクセルバッファ (RGBA)
 * overlay_buffer: 重ねるピクセルバッファ (RGBA) - FloodFillの結果
 * selection_mask: 選択範囲のマスク (0 or 1)
 * mode: 制限モード ("inside", "outside", "none")
 * width, height: 画像のサイズ
 * @param {Uint8Array} base_buffer
 * @param {Uint8Array} overlay_buffer
 * @param {Uint8Array} selection_mask
 * @param {string} mode
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array}
 */
export function composite_fill_result(base_buffer, overlay_buffer, selection_mask, mode, width, height) {
    const ptr0 = passArray8ToWasm0(base_buffer, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(overlay_buffer, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(selection_mask, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.composite_fill_result(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, width, height);
    var v5 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v5;
}

/**
 * @param {Uint8Array} mask
 * @param {number} mask_width
 * @param {number} mask_height
 * @param {number} box_x
 * @param {number} box_y
 * @param {number} box_width
 * @param {number} box_height
 * @returns {Uint8Array}
 */
export function trim_mask_with_box(mask, mask_width, mask_height, box_x, box_y, box_width, box_height) {
    const ptr0 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.trim_mask_with_box(ptr0, len0, mask_width, mask_height, box_x, box_y, box_width, box_height);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
 * Lasso選択のためのスキャンライン塗りつぶし実装
 *
 * この実装は以下の特徴を持ちます：
 * - ポリゴン内部をスキャンライン方式で効率的に判定
 * - Point-in-polygon アルゴリズムによる正確な内部判定
 * - バウンディングボックスによる計算範囲の最適化
 * - メモリ効率的な実装
 * - evenodd/nonzero塗りつぶし規則の選択
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {Float32Array} points
 * @param {string} fill_rule
 * @returns {boolean}
 */
export function fill_lasso_selection(mask, width, height, points, fill_rule) {
    var ptr0 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(points, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(fill_rule, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.fill_lasso_selection(ptr0, len0, mask, width, height, ptr1, len1, ptr2, len2);
    return ret !== 0;
}

/**
 * 選択範囲制限付きLasso選択
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {Float32Array} points
 * @param {Uint8Array} existing_mask
 * @param {string} limit_mode
 * @returns {boolean}
 */
export function fill_lasso_selection_with_mask(mask, width, height, points, existing_mask, limit_mode) {
    var ptr0 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(points, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(existing_mask, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(limit_mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.fill_lasso_selection_with_mask(ptr0, len0, mask, width, height, ptr1, len1, ptr2, len2, ptr3, len3);
    return ret !== 0;
}

/**
 * Point-in-polygon アルゴリズムを使用した直接的な実装（小さなポリゴン用）
 * @param {Uint8Array} mask
 * @param {number} width
 * @param {number} height
 * @param {Float32Array} points
 * @returns {boolean}
 */
export function fill_lasso_selection_point_in_polygon(mask, width, height, points) {
    var ptr0 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(points, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.fill_lasso_selection_point_in_polygon(ptr0, len0, mask, width, height, ptr1, len1);
    return ret !== 0;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}
/**
 * Apply brightness and contrast adjustments to the image
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 * @param {BrightnessContrastOption} options
 */
export function brightness_contrast(pixels, width, height, options) {
    var ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    _assertClass(options, BrightnessContrastOption);
    wasm.brightness_contrast(ptr0, len0, pixels, width, height, options.__wbg_ptr);
}

/**
 * Apply only brightness adjustment to the image
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 * @param {number} brightness
 */
export function brightness(pixels, width, height, brightness) {
    var ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.brightness(ptr0, len0, pixels, width, height, brightness);
}

/**
 * Apply only contrast adjustment to the image
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 * @param {number} contrast
 */
export function contrast(pixels, width, height, contrast) {
    var ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.contrast(ptr0, len0, pixels, width, height, contrast);
}

/**
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 */
export function invert(pixels, width, height) {
    var ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.invert(ptr0, len0, pixels, width, height);
}

/**
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 */
export function grayscale(pixels, width, height) {
    var ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.grayscale(ptr0, len0, pixels, width, height);
}

/**
 * ピクセルデータを上下反転する関数
 * WebGLのreadPixelsは下から上の順序で返すため、通常の画像として使う場合は反転が必要
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 */
export function flip_pixels_vertically(pixels, width, height) {
    var ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.flip_pixels_vertically(ptr0, len0, pixels, width, height);
}

/**
 * タイルバッファから指定領域のピクセルデータを抽出する関数
 * WebGLRendererのrender()メソッドで使用される重い処理を最適化
 * @param {Uint8Array} source_buffer
 * @param {number} source_width
 * @param {number} _source_height
 * @param {number} tile_x
 * @param {number} tile_y
 * @param {number} tile_width
 * @param {number} tile_height
 * @returns {Uint8Array}
 */
export function extract_tile_buffer(source_buffer, source_width, _source_height, tile_x, tile_y, tile_width, tile_height) {
    const ptr0 = passArray8ToWasm0(source_buffer, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.extract_tile_buffer(ptr0, len0, source_width, _source_height, tile_x, tile_y, tile_width, tile_height);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * 複数のピクセルバッファをブレンドする関数（CPUベースの最適化）
 * レイヤーの不透明度とブレンドモードを考慮した合成処理
 * @param {Uint8Array} base_buffer
 * @param {Uint8Array} overlay_buffer
 * @param {number} width
 * @param {number} height
 * @param {number} opacity
 * @param {number} blend_mode
 */
export function blend_layers(base_buffer, overlay_buffer, width, height, opacity, blend_mode) {
    var ptr0 = passArray8ToWasm0(base_buffer, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(overlay_buffer, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.blend_layers(ptr0, len0, base_buffer, ptr1, len1, width, height, opacity, blend_mode);
}

/**
 * メモリ使用量を計算するユーティリティ関数
 * @param {number} width
 * @param {number} height
 * @param {number} layer_count
 * @returns {number}
 */
export function calculate_texture_memory_usage(width, height, layer_count) {
    const ret = wasm.calculate_texture_memory_usage(width, height, layer_count);
    return ret >>> 0;
}

/**
 * @param {Uint8Array} target
 * @param {number} target_width
 * @param {number} target_height
 * @param {Uint8Array} patch
 * @param {number} patch_width
 * @param {number} patch_height
 * @param {number} offset_x
 * @param {number} offset_y
 * @returns {Uint8Array}
 */
export function patch_buffer_rgba(target, target_width, target_height, patch, patch_width, patch_height, offset_x, offset_y) {
    const ptr0 = passArray8ToWasm0(target, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(patch, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.patch_buffer_rgba(ptr0, len0, target_width, target_height, ptr1, len1, patch_width, patch_height, offset_x, offset_y);
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}

/**
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 * @param {GaussianBlurOption} options
 */
export function gaussian_blur(pixels, width, height, options) {
    var ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    _assertClass(options, GaussianBlurOption);
    wasm.gaussian_blur(ptr0, len0, pixels, width, height, options.__wbg_ptr);
}

/**
 * Extract RGBA pixels from `source` where `mask` (1 byte per pixel) is non-zero.
 * - `source`: RGBA buffer (width=source_width, height=source_height)
 * - `mask`: 1 byte per pixel (0 or 1), dimensions `mask_width` x `mask_height`
 * - `mask_offset_x/y`: where to sample from the source for mask(0,0)
 * Returns an RGBA buffer sized `mask_width * mask_height * 4`, where non-selected pixels are fully transparent.
 * @param {Uint8Array} source
 * @param {number} source_width
 * @param {number} source_height
 * @param {Uint8Array} mask
 * @param {number} mask_width
 * @param {number} mask_height
 * @param {number} mask_offset_x
 * @param {number} mask_offset_y
 * @returns {Uint8Array}
 */
export function slice_patch_rgba(source, source_width, source_height, mask, mask_width, mask_height, mask_offset_x, mask_offset_y) {
    const ptr0 = passArray8ToWasm0(source, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(mask, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.slice_patch_rgba(ptr0, len0, source_width, source_height, ptr1, len1, mask_width, mask_height, mask_offset_x, mask_offset_y);
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}

/**
 * @enum {0 | 1}
 */
export const AlphaBlurMode = Object.freeze({
    /**
     * Skip alpha channel (preserve original alpha values)
     */
    Skip: 0, "0": "Skip",
    /**
     * Apply blur to alpha channel as well
     */
    Blur: 1, "1": "Blur",
});

const BrightnessContrastOptionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_brightnesscontrastoption_free(ptr >>> 0, 1));

export class BrightnessContrastOption {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BrightnessContrastOptionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_brightnesscontrastoption_free(ptr, 0);
    }
    /**
     * Brightness adjustment (-100.0 to 100.0, 0.0 = no change)
     * @returns {number}
     */
    get brightness() {
        const ret = wasm.__wbg_get_brightnesscontrastoption_brightness(this.__wbg_ptr);
        return ret;
    }
    /**
     * Brightness adjustment (-100.0 to 100.0, 0.0 = no change)
     * @param {number} arg0
     */
    set brightness(arg0) {
        wasm.__wbg_set_brightnesscontrastoption_brightness(this.__wbg_ptr, arg0);
    }
    /**
     * Contrast adjustment (-100.0 to 100.0, 0.0 = no change)
     * @returns {number}
     */
    get contrast() {
        const ret = wasm.__wbg_get_brightnesscontrastoption_contrast(this.__wbg_ptr);
        return ret;
    }
    /**
     * Contrast adjustment (-100.0 to 100.0, 0.0 = no change)
     * @param {number} arg0
     */
    set contrast(arg0) {
        wasm.__wbg_set_brightnesscontrastoption_contrast(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} brightness
     * @param {number} contrast
     */
    constructor(brightness, contrast) {
        const ret = wasm.brightnesscontrastoption_new(brightness, contrast);
        this.__wbg_ptr = ret >>> 0;
        BrightnessContrastOptionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) BrightnessContrastOption.prototype[Symbol.dispose] = BrightnessContrastOption.prototype.free;

const GaussianBlurOptionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gaussianbluroption_free(ptr >>> 0, 1));

export class GaussianBlurOption {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GaussianBlurOptionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gaussianbluroption_free(ptr, 0);
    }
    /**
     * Blur radius (higher values create stronger blur effect)
     * @returns {number}
     */
    get radius() {
        const ret = wasm.__wbg_get_gaussianbluroption_radius(this.__wbg_ptr);
        return ret;
    }
    /**
     * Blur radius (higher values create stronger blur effect)
     * @param {number} arg0
     */
    set radius(arg0) {
        wasm.__wbg_set_gaussianbluroption_radius(this.__wbg_ptr, arg0);
    }
    /**
     * How to handle the alpha channel
     * @returns {AlphaBlurMode}
     */
    get alpha_mode() {
        const ret = wasm.__wbg_get_gaussianbluroption_alpha_mode(this.__wbg_ptr);
        return ret;
    }
    /**
     * How to handle the alpha channel
     * @param {AlphaBlurMode} arg0
     */
    set alpha_mode(arg0) {
        wasm.__wbg_set_gaussianbluroption_alpha_mode(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} radius
     * @param {AlphaBlurMode} alpha_mode
     */
    constructor(radius, alpha_mode) {
        const ret = wasm.gaussianbluroption_new(radius, alpha_mode);
        this.__wbg_ptr = ret >>> 0;
        GaussianBlurOptionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) GaussianBlurOption.prototype[Symbol.dispose] = GaussianBlurOption.prototype.free;

export function __wbg_log_ebd55c6c1fc61cdb(arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
};

export function __wbg_wbindgencopytotypedarray_d105febdb9374ca3(arg0, arg1, arg2) {
    new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
};

export function __wbg_wbindgenthrow_451ec1a8469d7eb6(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_0;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

