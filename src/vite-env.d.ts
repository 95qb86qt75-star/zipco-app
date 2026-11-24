/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly QA_LOAD_DIAGNOSTICS: boolean;
  readonly QA_LOAD_DIAGNOSTICS_VERSION: string;
  readonly QA_NOTIFICATION_TRACE: boolean;
}
