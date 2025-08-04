# Sledge

[![release](https://github.com/Innsbluck-rh/sledge/actions/workflows/release.yml/badge.svg)](https://github.com/Innsbluck-rh/sledge/actions/workflows/release.yml)
&nbsp;
[![dev](https://github.com/Innsbluck-rh/sledge/actions/workflows/dev.yml/badge.svg)](https://github.com/Innsbluck-rh/sledge/actions/workflows/dev.yml)
&nbsp;
![Vercel Deploy](https://deploy-badge.vercel.app/vercel/sledge-gold)
&nbsp;
![GitHub Release](https://img.shields.io/github/v/release/Innsbluck-rh/sledge)

<div align="center">

<br>

<img src="assets/FCHS.png" alt="F.C.H.S." width=600 />

<br>
<br>

Sledge is a drawing tool.

**Simple.**&nbsp;&nbsp;&nbsp;**Fast.**&nbsp;&nbsp;&nbsp;**Destructive.**

www.sledge-rules.app

</div>

<br>

## Platform Support

- :white_check_mark: **Windows**
- :ballot_box_with_check: **MacOS**
- :ballot_box_with_check: **Linux**
- :x: **Mobile**

## Install

1. Visit [www.sledge-rules.app](https://www.sledge-rules.app/) and download installer.
2. Run the installer and complete install.
3. Run sledge.

## Features

### Interacts

- [x] Mouse
- [x] Pen
- [x] Touch
- [ ] Touchpads

### Tools

- [x] Pen, Eraser
- [x] Fill
- [x] Color Picker
- [x] Selection
- [ ] Selection Editing (copy, paste)
- [ ] Shape drawing (line, circle, rect)

### Composites / Effects

- [x] Layer Opacity
- [x] Layer Composite (normal / multiply)
- [ ] Effects
- [ ] Animation Support

### I/O

- [x] Basic I/O (load, save, import, export)
- [x] SVG Export (for small pixel art/icons)
- [x] Auto save

## Tech

### Frontend / Website

- [SolidJS](https://github.com/solidjs/solid)
- [Vite](https://github.com/vitejs/vite)

### Backend

- [Tauri](https://github.com/tauri-apps/tauri)

### Image Processing / Layer Composite

- [WASM](https://developer.mozilla.org/ja/docs/WebAssembly) ([wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen) / [wasm-pack](https://github.com/drager/wasm-pack))
- [WebGL](https://developer.mozilla.org/ja/docs/Web/API/WebGL_API)

### Project File Format

- [msgpack](https://msgpack.org/ja.html)




