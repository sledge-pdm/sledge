interface ImportMetaEnv {
  readonly VITE_GITHUB_REST_API_URL: string;
  readonly VITE_GITHUB_OWNER: string;
  readonly VITE_GITHUB_REPO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
