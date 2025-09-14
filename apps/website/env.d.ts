/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_REST_API_URL?: string;
  readonly VITE_GITHUB_OWNER?: string;
  readonly VITE_GITHUB_REPO?: string;
  readonly VITE_GITHUB_PAT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
