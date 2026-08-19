// Hand-written CommonJS — no bundler, no TypeScript, no import/export.
// The sandboxed preload environment only understands plain scripts with require().
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,

  notifyReady: function () {
    ipcRenderer.send("renderer-ready");
  },

  onOpenVcf: function (callback) {
    function listener(_event, payload) {
      callback(payload);
    }
    ipcRenderer.on("vcf:open", listener);
    return function () {
      ipcRenderer.removeListener("vcf:open", listener);
    };
  },
});
