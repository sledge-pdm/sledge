# Sledge

[![release](https://github.com/Innsbluck-rh/sledge/actions/workflows/release.yml/badge.svg)](https://github.com/Innsbluck-rh/sledge/actions/workflows/release.yml)
&nbsp;
[![dev](https://github.com/Innsbluck-rh/sledge/actions/workflows/dev.yml/badge.svg)](https://github.com/Innsbluck-rh/sledge/actions/workflows/dev.yml)
&nbsp;
![GitHub Release](https://img.shields.io/github/v/release/Innsbluck-rh/sledge)

<div align="center">

<img alt="SLEDGEHAMMER." src="./apps/sledge/assets/companion_light.png" width=250 height=250 />

Sledge is a drawing tool.

**1. Simple.**

**2. Fast.**

**3. Destructive.**

</div>

## Visual

![alt text](FCHS.png)

## Install

> note that this app is prealpha version!\
> Also note that I currently do testing on **Windows only**.

1. Go to [Release](https://github.com/Innsbluck-rh/sledge/releases) page and install suitable installer.
2. Run installer and complete install.
3. Run sledge.

## Feature roadmap

### Interacts

- [x] Mouse
- [x] Pen
- [x] Touch
- [ ] Touch pads

### Tools

- [x] Pen, Eraser
- [x] Fill
- [x] Color Picker
- [x] Selection
- [ ] Selection Editing (copy, paste)

### Composites / Effects

- [x] Layer Composite (normal / multiply)
- [ ] Effects
- [ ] Copy/Paste Selection

### I/O

- [x] Basic I/O (load, save, import, export)
- [x] SVG Export (for small pixel art/icons)
- [x] Auto save

## Tech

### Frontend / Website

- [SolidJS](https://github.com/solidjs/solid)
- [Vite](https://github.com/vitejs/vite)

### Backend (platform-specific)

- [Tauri v2](https://github.com/tauri-apps/tauri)

### Image Processing / Layer Composite

- [WASM](https://developer.mozilla.org/ja/docs/WebAssembly) ([wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen), [wasm-pack](https://github.com/drager/wasm-pack), [tauri-wasm](https://github.com/nanoqsh/tauri-wasm))
- [WebGL](https://developer.mozilla.org/ja/docs/Web/API/WebGL_API)

### Project File Format

- [msgpack](https://msgpack.org/ja.html)
