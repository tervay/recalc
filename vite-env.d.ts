/// <reference types="vite-plugin-comlink/client" />

interface ImportMetaEnv {
  /** OpenPanel client id used to initialize web analytics. */
  readonly VITE_OPENPANEL_CLIENT_ID?: string;
}

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*?worker&url' {
  const src: string;
  export default src;
}
