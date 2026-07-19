export const isElectron = (): boolean => {
  try {
    // Preferred signal: the preload bridge exposes this under contextIsolation,
    // independent of nodeIntegration (which we keep disabled).
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron === true) {
      return true;
    }

    // Renderer process with nodeIntegration
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process?.type === 'renderer') {
      return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
      return true;
    }

    // Detect via user agent (works when nodeIntegration is false)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.userAgent === 'string' &&
      navigator.userAgent.toLowerCase().includes('electron')
    ) {
      return true;
    }
  } catch {
    // If any reference errors occur, we're probably not in Electron
    return false;
  }

  return false;
};

export const getElectronVersion = (): string | null => {
  if (isElectron()) {
    return process.versions?.electron || 'unknown';
  }
  return null;
};
