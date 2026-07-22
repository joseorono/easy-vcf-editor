// Global type declarations - these are automatically available throughout the project

declare global {
  // Generic for anything that can be null
  type Nullable<T> = T | null;

  // Anything that can be rendered in a React component
  type RenderableElement = JSX.Element | string | null;

  // Utility type to extract values from an array as a union
  type ValuesOf<T extends readonly unknown[]> = T[number];

  // DO NOT MODIFY
  // utility type that takes an object type and makes the hover overlay more readable.
  // Looks like a hack, but it's a well-known pattern in TypeScript.
  type Prettify<T> = {
    [K in keyof T]: T[K];
  } & {};
}

// WebMCP (experimental agentic-browsing API, http://goo.gle/webmcp-docs).
// Progressive enhancement: present only in agent-capable browsers, so every
// use is feature-detected. Typed here to avoid `as any` at the call site.
// Inside `declare global` so the types (and the Navigator augmentation) are
// visible project-wide from this module file.
declare global {
  interface WebMcpToolResult {
    content: Array<{ type: "text"; text: string }>;
  }

  interface WebMcpTool {
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    execute: (args: Record<string, unknown>) => Promise<WebMcpToolResult>;
  }

  interface WebMcpModelContext {
    registerTool?: (tool: WebMcpTool) => { unregister?: () => void } | void;
    unregisterTool?: (name: string) => void;
  }

  interface Navigator {
    modelContext?: WebMcpModelContext;
  }
}

// Plain CSS side-effect imports (e.g. `import '@fontsource/press-start-2p/index.css'`).
// Required because noUncheckedSideEffectImports rejects untyped .css imports.
declare module '*.css';

// CSS Modules type declaration
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Image file declarations
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}


// This export statement is required to make this file a module
// and enable the global declarations above
export {};
