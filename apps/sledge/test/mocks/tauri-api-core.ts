import { vi } from 'vitest';

export const invoke = vi.fn();
export const transformCallback = vi.fn((cb: (...args: any[]) => any) => cb);
export const convertFileSrc = vi.fn((path: string) => path);
