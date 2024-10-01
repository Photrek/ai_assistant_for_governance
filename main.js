import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

console.log('Preload script path:', path.join(app.getAppPath(), 'preload.js'));

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true, 
      preload: path.join(app.getAppPath(), 'preload.js')
    },
  });

  const isDev = await import('electron-is-dev').then(module => module.default);

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(app.getAppPath(), 'build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Load and apply preload script considering if the app is packaged or not
  mainWindow.webContents.once('dom-ready', async () => {
    let preloadPath;
    if (app.isPackaged) {
      // If the app is packaged, preload.js should be outside ASAR or correctly unpacked
      preloadPath = path.join(app.getAppPath(), 'preload.js');
    } else {
      preloadPath = path.join(__dirname, 'preload.js');
    }
    
    console.log('Attempting to import preload from:', preloadPath);

    try {
      await mainWindow.webContents.executeJavaScript(`import('${preloadPath.replace(/\\/g, '/')}')`);
    } catch (error) {
      console.error('Failed to load preload script:', error);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron app events
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg);
  event.reply('asynchronous-reply', 'pong');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});