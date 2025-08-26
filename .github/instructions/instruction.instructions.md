---
applyTo: '**'
---

This is the monorepo for project called Sledge.
Sledge is pixel-based drawing tool made with Tauri v2, SolidJS and Vite.

Apps

- /apps/sledge ... main app
- /apps/website ... brand website (https://sledge-rules.app)

Packages

- /packages/core ... core package (some basic types and consts)
- /packages/theme ... theme package (reset/global styles, fonts, and color theme)
- /packages/ui ... ui package (common things such as Dropdown)
- /packages/wasm ... Some functions written in WASM (mostly low-level and heavy actions, such as flood fill)

When user creates component in **/components directory, use "Component" type from SolidJS, not "React.FC".
Like:

```tsx
import { Component } from 'solid-js';

const MyComponent: Component = () => {
  return <div>Hello, SolidJS!</div>;
};
```

User mostly use Powershell for development, then the separator for the bash commands is `;`.
