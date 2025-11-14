
# Instructions

- Respond in the language used in the incoming message.

## Abstract

This is the monorepo for project called Sledge.
Sledge is pixel-based drawing tool made with Tauri v2, SolidJS and Vite.

## Monorepo structure

### Apps

- /apps/sledge ... main app
- /apps/website ... brand website (https://sledge-rules.app)

### Packages

- /packages/core ... core package (some basic types and consts)
- /packages/theme ... theme package (reset/global styles, fonts, and color theme)
- /packages/ui ... ui package (common things such as Dropdown)
- /packages/wasm ... Some functions written in WASM. sledge-specific functions like selection ops are put here.
- /packages/anvil ... Anvil is buffer operation package. It's basically for sledge, but I'm aiming to make it separated with any specific code in sledge.

## Commands

Note that this is monorepo, hence terminal will start in root path by default.
You can use the commands below in root path.

- pnpm dev = start sledge app(equal to "cd apps/sledge; pnpm tauri dev")
- pnpm build = build sledge app(equal to "cd apps/sledge; pnpm tauri build")
- pnpm site:dev = start sledge website(equal to "cd apps/website; pnpm dev")
- pnpm site:build = build sledge website(equal to "cd apps/website; pnpm build")
- pnpm wasm:build = build wasm package(equal to "cd packages/wasm && pnpm --ignore-workspace i && wasm-pack build --target bundler". also note that sledge uses vite and "--target bundler" is a proper argument.)
