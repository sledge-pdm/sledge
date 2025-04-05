# Sledge

<img src="./public/readme_intro.png" alt="the picture of a well-drawn sledgehammer." width="500px"/>\

> this project is pre-alpha.  
> feel free to DM me: [@alphendp](https://x.com/alphendp)

## what you'll get

### ■&ensp;&nbsp;pixel-perfect drawing experience

- **no alpha channels**. \
  _erasing just works — nothing left behind._

- **dot magnification** factor, such as "x1" or "x4". \
  it enables you to put some _out-of-place_ pixel art on a high-definition background — all on the same canvas.

  <!-- some introduction picture for layers -->

### \>\_ &nbsp;useful (or _unstable_) effects

- built-in stuff:

  - standard effect (brightness, contrast, invert, etc.)

  - filter and split functions - _w/ multiple node outputs_ (splitV, colorRange, rect, etc.)

  - **...and some REALLY destructive effects** (JPEG glitches, etc.)

- all effects written in Rust.

  <!-- some introduction picture for the effects -->

### :)&emsp;companion

- the pretty companion that improves your drawing experiment.\
  _everyone loves a good "AI assistant", right?_

## pipeline DSL

sledge pipeline DSL (wip title) is a flexible and powerful way to mess w/ your own pixels.

```shell
# layer_N: unique id for layerN
# in(layer_N): read the image data from layer.
# out(layer_N): output the image data to layer.

in(layer_0) > out(layer_0)  # do nothing.

in(layer_0) > contrast(20%) > invert() > out(layer_0)  # apply contrast+20%, then invert it.

in(layer_1) > splitV(50%) > *multi(*upper, *lower)  # apply grayscale, split vertically in half.
upper > jpeg_glitch(9, 72) > *merged                # apply jpeg_glitch for the upper half of layer1.
lower > invert() > *merged                          # invert the lower half of layer1.
merged > out(layer_1)                               # merge split images and throw back to layer1.

# note 1: *upper, *lower, and *merged are called "subout nodes" (basically like named pipes.)
# note 2: subout nodes automatically merge/override multiple inputs.
```

### too lazy to remember commands?

- no prob! — just add / swap / mutate effects in the GUI node editor.
- of course, you can also run raw command-line from the console input.\
  either way, effects are applied immediately — and reactively.

## build

```bash
git clone https://gitlab.com/Innsbluck/sledge.git
cd sledge
pnpm install
pnpm tauri dev
```

## tech

- [SolidJS](https://www.solidjs.com/) (UI)
- [Tauri](https://tauri.app/) (Desktop wrapper)
- [Rust](https://www.rust-lang.org/) (Image engine)
- [eSpeak NG](https://github.com/espeak-ng/espeak-ng) (TTS engine)
