/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_USER_ID: string
  readonly VITE_ADMIN_PASSWORD: string
  readonly VITE_CP_USER_ID: string
  readonly VITE_CP_PASSWORD: string
  readonly VITE_MONGO_DATA_API_URL: string
  readonly VITE_MONGO_DATA_API_KEY: string
  readonly VITE_MONGO_DATA_SOURCE: string
  readonly VITE_MONGO_DB: string
  readonly VITE_MONGO_LEADS_COLLECTION: string
  readonly VITE_MONGO_CONFIG_COLLECTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
