/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASSET_URL: string;
  // Add other variables you use:
  // readonly VITE_SOME_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
