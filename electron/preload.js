const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appAPI", {
  getData: () => ipcRenderer.invoke("get-data"),
  saveData: (appData) => ipcRenderer.invoke("save-data", appData),
  resetData: () => ipcRenderer.invoke("reset-data")
});
