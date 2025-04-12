# DSL nodes TODO

## effect node

- [x] bright(n) (currently its "brightness") #明るさ
- [ ] contrast(n) #コントラスト
- [ ] saturate(n) #彩度
- [ ] hue(n) #色相
- [x] grayscale()（= saturate(-100)）
- [x] tone("sepia")
- [x] invert()
- [ ] blur(radius)
- [ ] sharpen(amount)

## pass node

### in/out

- [ ] in(layer_id) (that actually works as node)
- [ ] out(layer_id) (that actually works as node)
- [ ] multiout(\*a, \*b)

### area filter

- [ ] splitH(rate)
- [ ] splitV(rate)
- [ ] rect(lt, rt, lb, rb)
- [ ] select(x1, y1, x2, y2, ...) #多ピクセル座標指定で選択
- [ ] rand_hlines_area(density, seed)
- [ ] rand_vlines_area(density, seed)

## fracture node

- [x] jpeg_glitch(seed, quality, amount)

## combine node (image-level DSL)

入力元のデータの上にabove_dataを重ねる

- [ ] combine_override(above_data) #通常(上書き)
- [ ] combine_multiply(above_data) #乗算
- [ ] combine_add(above_data) #加算
- [ ] combine_exclude(above_data) #除外
- [ ] combine_mask(above_data) #マスク(透明以外で)

## other syntaxs

- [ ] assertions `[some-assertion]`
- [ ] instant subout memory `\*subout`
- [ ] pre-init subout memory `init subout`
