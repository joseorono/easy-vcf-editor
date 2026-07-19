// Type definitions for Electron-specific globals

interface Window {
  process?: {
    type: string;
  };
  // Exposed by electron/preload.ts via contextBridge under contextIsolation
  electronAPI?: {
    platform: string;
    isElectron: boolean;
  };
}

// Extend the NodeJS.Process interface
declare namespace NodeJS {
  interface ProcessVersions {
    electron?: string;
  }
}

// Scoped ambient `process` for the renderer, which is browser-only
// (tsconfig.app uses `types: ["vite/client"]`, no Node types by design).
// This narrows just what electron-detector.ts touches, without pulling in
// the full Node global surface. Declared as always-defined (like @types/node)
// so property access doesn't trip strict "possibly undefined"; actual absence
// in the browser is handled at runtime via `typeof process !== 'undefined'`.
declare const process: {
  type?: string;
  platform?: string;
  versions?: { electron?: string; [key: string]: string | undefined };
};
