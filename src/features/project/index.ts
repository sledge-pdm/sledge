// Consts is deliberately not re-exported: it has no imports of its own, and the store layer depends on it.
// Routing it through here would drag service.ts - and with it EditorStores - into that dependency.
export * from './service';
