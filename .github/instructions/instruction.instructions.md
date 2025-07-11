---
applyTo: '**'
---

This project uses SolidJS and Vite.

When user creates component in \*\*/components directory, use "Component" type from SolidJS, not "React.FC".
Like:

```tsx
import { Component } from 'solid-js';

const MyComponent: Component = () => {
  return <div>Hello, SolidJS!</div>;
};
```

User mostly use Powershell for development, then the separator for the bash commands is `;`.
