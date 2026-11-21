/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_SHORT_NAME?: string
  readonly VITE_APP_ICON?: string
  readonly VITE_DEFAULT_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
