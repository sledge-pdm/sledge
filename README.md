# Sledge

[![release](https://github.com/sledge-pdm/sledge/actions/workflows/release.yml/badge.svg)](https://github.com/sledge-pdm/sledge/actions/workflows/release.yml)
&nbsp;
[![development_release](https://github.com/sledge-pdm/sledge/actions/workflows/development_release.yml/badge.svg)](https://github.com/sledge-pdm/sledge/actions/workflows/development_release.yml)
&nbsp;
[![development_build](https://github.com/sledge-pdm/sledge/actions/workflows/development_build.yml/badge.svg)](https://github.com/sledge-pdm/sledge/actions/workflows/development_build.yml)
&nbsp;
![Vercel Deploy](https://deploy-badge.vercel.app/vercel/sledge-gold)
&nbsp;
![GitHub Release](https://img.shields.io/github/v/release/sledge-pdm/sledge)

<div align="center">

<br>

<img src="https://github.com/sledge-pdm/sledge-assets/blob/0a516e7a70669d60c370e400b2b2e83e74eb6c07/0827sledge_dark.png?raw=true" alt="the visual of sledge." width=600 />

<br>
<br>
Sledge is a drawing tool.

**Simple.**&nbsp;&nbsp;**Fast.**&nbsp;&nbsp;**Destructive.**

</div>

<br>

## Install

1. Visit [sledge-rules.app](https://www.sledge-rules.app/) and download installer.
2. Complete install.
3. Run sledge.

## Platform Supports

| Platform | Status                  | Detail                 |
| -------- | ----------------------- | -----------------------|
| Windows  | :white_check_mark:      | _OK._                  |
| MacOS    | :white_check_mark:      | _almost OK._           |
| Linux    | :ballot_box_with_check: | _barely OK._           |
| Mobile   | :zzz:                   | _No builds available._ |

> Need testers for MacOS/Linux builds! Post anything in [Discussions](https://github.com/sledge-pdm/sledge/discussions), or report bug in [Issues](https://github.com/sledge-pdm/sledge/issues).

> Mobile build is planned in the future.

## Fonts

- [04b_XX](http://www.04.jp.org)\
  _by yuji oshimoto (04.jp.org)_
- [k12x8 / k8x12](https://littlelimit.net/k12x8.htm)\
  _by num_kadoma (littlelimit.net)_
- [PixelMPlus](https://itouhiro.hatenablog.com/entry/20130602/font)\
  _by itouhiro (itouhiro.hatenablog.com)_
- [Terminus](https://files.ax86.net/terminus-ttf/)\
  _by Dimitar Zhekov_

## Tech

- [Tauri](https://github.com/tauri-apps/tauri): main framework
- [Vite](https://github.com/vitejs/vite): dev server
- [SolidJS](https://github.com/solidjs/solid): web frontend
- [ecsstatic](https://www.ecsstatic.dev/): stylesheet gen
- [Anvil](https://github.com/sledge-pdm/anvil): buffer operation package for sledge
- [WebGL2](https://developer.mozilla.org/ja/docs/Web/API/WebGL_API): layer blend / display
- [mitt](https://github.com/developit/mitt): eventbus
- [msgpackr](https://github.com/kriszyp/msgpackr/issues): project file compression
- [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)+[wasm-pack](https://github.com/drager/wasm-pack): fast operations using rust (ex. floodfill)
