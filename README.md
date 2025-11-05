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

<img src="https://github.com/sledge-pdm/sledge-assets/blob/main/readme_top.jpg?raw=true" alt="the visual of sledge." width=500 />


</div>

## Features

* Pen, Eraser, Fill
* Selection (rect, auto, lasso)
* Image Import/Export (png, jpg, webp, svg)
* Project History (Undo/Redo)
* Copy and paste
* Project Snapshots
* Image Effects

- ...and the ***ＲＡＤ*** user interface, as you see.

## Platform Supports

| Platform | Availability   | Status             | Detail                 |
| -------- | -------------- | ------------------ | ---------------------- |
| Windows  | **Available.** | :white_check_mark: | _Stable._              |
| Mac      | **Available.** | :white_check_mark: | _Almost stable._       |
| Linux    | **Available.** | :warning:          | _Unstable._            |
| Mobile   | Not available. | :zzz:              | _No builds available._ |

> We need testers for Mac/Linux builds! Please post any feedback in [Discussions](https://github.com/sledge-pdm/sledge/discussions) or report bugs in [Issues](https://github.com/sledge-pdm/sledge/issues).

> Mobile build is planned in the future.

## Install

1. Visit [sledge-rules.app](https://www.sledge-rules.app/) and download installer.
2. Follow the instructions to complete the installation.

## Tech

- [Tauri](https://github.com/tauri-apps/tauri) / main framework
- [Vite](https://github.com/vitejs/vite) / development server
- [SolidJS](https://github.com/solidjs/solid) / frontend UI
- [ecsstatic](https://www.ecsstatic.dev/) / stylesheet generation
- [anvil](https://github.com/sledge-pdm/anvil) / image buffer operation
- [WebGL2](https://developer.mozilla.org/ja/docs/Web/API/WebGL_API) / layer blend & rendering
- [mitt](https://github.com/developit/mitt) / eventbus
- [iro.js](https://iro.js.org/) / color picker
- [msgpackr](https://github.com/kriszyp/msgpackr/issues) / project file compression
- [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)+[wasm-pack](https://github.com/drager/wasm-pack) / fast operations using Rust (e.g., flood fill)

## Fonts

- [04b_XX](http://www.04.jp.org) / _by Yuji Oshimoto (04.jp.org)_
- [k12x8 / k8x12](https://littlelimit.net/k12x8.htm) / _by Num_kadoma (littlelimit.net)_
- [PixelMPlus](https://itouhiro.hatenablog.com/entry/20130602/font) / _by Itouhiro (itouhiro.hatenablog.com)_
- [Terminus](https://files.ax86.net/terminus-ttf/) / _by Dimitar Zhekov_
