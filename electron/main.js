const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

app.setName("Dijital Kahramanlar");
app.setAppUserModelId("com.dijitalkahramanlar.app");

let mainWindow;

const dataPath = path.join(app.getPath("userData"), "groups.json");
const defaultData = require("../src/data/defaultSession.json");
const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
const appIconPath = path.join(__dirname, "../resources/icon.png");

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(defaultData));
}

function createDataFileIfNotExists() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(cloneDefaultData(), null, 2));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Dijital Kahramanlar",
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    icon: appIconPath,
    autoHideMenuBar: true,
    backgroundColor: "#14141f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL(devServerUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    });
  }
}

app.whenReady().then(() => {
  createDataFileIfNotExists();
  createWindow();
});

ipcMain.handle("get-data", () => {
  const data = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(data);
});

ipcMain.handle("save-data", (event, appData) => {
  fs.writeFileSync(dataPath, JSON.stringify(appData, null, 2));
  return true;
});

ipcMain.handle("reset-data", () => {
  const resetData = cloneDefaultData();
  fs.writeFileSync(dataPath, JSON.stringify(resetData, null, 2));
  return resetData;
});
