/// <reference types="vite-plugin-comlink/client" />

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*?worker&url' {
  const src: string;
  export default src;
}
