import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pickVcfArgvEntries } from "../src/lib/electron-argv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

// Becomes true once the window has finished loading, so file delivery can be
// deferred until the renderer is actually ready to receive IPC.
let windowReady = false;

// vCard paths opened before the renderer finished loading. They are flushed as
// ONE `vcf:open` batch on `did-finish-load` (or on `second-instance` once ready).
const pendingFiles: string[] = [];

function createWindow(): BrowserWindow {
  const iconPath = isDev
    ? path.join(__dirname, "..", "public", "pwa-192x192.png")
    : path.join(__dirname, "..", "dist", "pwa-192x192.png");

  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: "Easy VCF Editor",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.on("ready-to-show", () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Deliver any files that were opened before the window finished loading.
  window.webContents.on("did-finish-load", () => {
    windowReady = true;
    void flushPendingVcfFiles();
  });

  if (isDev) {
    window.loadURL("http://localhost:5173");
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow = window;
  return window;
}

/**
 * Reads a single opened file and delivers its vCard text to the renderer.
 * Read failures are surfaced over `vcf:open-error` instead of being thrown, so
 * a bad file never blocks the rest of a batch.
 */
async function deliverVcf(filePath: string): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    const content = await readFile(filePath, "utf8");
    mainWindow.webContents.send("vcf:open", {
      name: path.basename(filePath),
      content,
    });
  } catch (error) {
    mainWindow.webContents.send("vcf:open-error", {
      name: path.basename(filePath),
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delivers every queued file as ONE `vcf:open` batch. Multiple files are
 * concatenated with `\r\n` so the renderer parser treats them as a single
 * multi-contact collection (mirroring the dropzone's `texts.join("\r\n")`).
 * Individual read failures are reported over `vcf:open-error` and skipped.
 */
async function flushPendingVcfFiles(): Promise<void> {
  const filePaths = pendingFiles.splice(0, pendingFiles.length);
  if (filePaths.length === 0 || !mainWindow || mainWindow.isDestroyed()) return;

  if (filePaths.length === 1) {
    await deliverVcf(filePaths[0]);
    return;
  }

  const contents: string[] = [];
  for (const filePath of filePaths) {
    try {
      contents.push(await readFile(filePath, "utf8"));
    } catch (error) {
      mainWindow.webContents.send("vcf:open-error", {
        name: path.basename(filePath),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (contents.length > 0) {
    mainWindow.webContents.send("vcf:open", {
      name: "batch",
      content: contents.join("\r\n"),
    });
  }
}

// Single-instance lock: a second launch (Windows delivers a double-clicked
// `.vcf` to a NEW process) hands its file paths back to this instance instead
// of starting another copy.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    const files = pickVcfArgvEntries(commandLine, process.execPath);
    if (files.length > 0) {
      pendingFiles.push(...files);
      if (windowReady) {
        void flushPendingVcfFiles();
      }
    }
  });

  app.whenReady().then(() => {
    // Cold start: files passed on the command line (e.g. double-clicking a
    // `.vcf` while the app is not running). An empty result means a normal
    // launch with no import.
    const coldStartFiles = pickVcfArgvEntries(process.argv, process.execPath);
    if (coldStartFiles.length > 0) {
      pendingFiles.push(...coldStartFiles);
    }

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
