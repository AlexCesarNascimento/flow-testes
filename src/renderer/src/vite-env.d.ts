/// <reference types="vite/client" />

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

interface Window {
  api: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  };
}
