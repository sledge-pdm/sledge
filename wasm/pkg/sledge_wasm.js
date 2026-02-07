/* @ts-self-types="./sledge_wasm.d.ts" */

import * as wasm from "./sledge_wasm_bg.wasm";
import { __wbg_set_wasm } from "./sledge_wasm_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    apply_mask_offset, auto_select_region_mask, combine_masks_add, combine_masks_replace, combine_masks_subtract, create_opacity_mask, fill_lasso_selection, fill_mask_area, fill_rect_mask, flip_pixels_vertically, mask_to_path, scanline_flood_fill, scanline_flood_fill_with_mask, trim_mask_with_box
} from "./sledge_wasm_bg.js";
