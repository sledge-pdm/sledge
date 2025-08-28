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

<img src="assets/0827sledge_light.png" alt="F.C.H.S." width=600 />

<br>
Sledge is a drawing tool.

**Simple.**&nbsp;&nbsp;&nbsp;**Fast.**&nbsp;&nbsp;&nbsp;**Destructive.**

</div>

<br>

## Platform Support

- **Windows** ... :white_check_mark: *OK.*
- **MacOS** ... :white_check_mark: *almost OK. some ui/ux issues were found.*
- **Linux** ... :ballot_box_with_check: *almost NOTOK, but you can barely use.*
- **Mobile** ... :zzz: *No builds available.*

## Install

1. Visit [sledge-rules.app](https://www.sledge-rules.app/) to download installer.
2. Run the installer and complete install.
3. Run sledge.

<details>

<summary>For Mac users</summary>

MacOS mostly reports an error like: *App is Damaged*.
To prevent it, run this command in bash before running:
```bash
xattr -rc /Applications/sledge.app
```

</details>

## Features

* 🏁 Refined Pixel-Based UI
* :sparkles: Interface for faster & concentrated creation.
* :art: Multiple Layer Composite w/ Blend Modes
* :zap: Fast Image Operation via WebGL/WASM
* :file_folder: Project File Association (.sledge)

<details>
<summary>WIP status</summary>

### Interacts

- [x] Mouse
- [x] Pen
- [x] Touch
- [ ] Touchpads

### Tools

- [x] Pen, Eraser
- [x] Fill
- [x] Color Picker
- [x] Image Pool (resize, burndown)
- [x] Selection (Rect, Auto)
- [ ] Selection Editing (copy, paste)
- [ ] Text (editable)

### Composites / Effects

- [x] Layer Opacity
- [x] Layer Composite (normal / multiply)
- [ ] Effects
- [ ] Animation Support

### I/O

- [x] Basic I/O (load, save, import, export)
- [x] SVG Export (for small pixel art/icons)
- [x] Auto save
- [ ] Clipboard Support
- [ ] Project-Level History
  
</details>

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





