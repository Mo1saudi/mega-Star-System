import { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, Notification } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getAppDataDirectories() {
  const userAppData = app.getPath('userData');
  const dirs = {
    database: path.join(userAppData, 'Database'),
    passports: path.join(userAppData, 'UploadedPassports'),
    excel: path.join(userAppData, 'ImportedExcel'),
    pdfs: path.join(userAppData, 'GeneratedPDFs'),
    logs: path.join(userAppData, 'Logs'),
    backups: path.join(userAppData, 'Backups')
  };

  Object.values(dirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return dirs;
}

function createWindow() {
  const dirs = getAppDataDirectories();

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'ميجا ستار - إدارة عمليات العمرة',
    icon: path.join(__dirname, '../public/icon.ico'),
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      webSecurity: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (mainWindow) {
      mainWindow.hide();
      event.preventDefault();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon.png');
  const icon = fs.existsSync(iconPath) 
    ? nativeImage.createFromPath(iconPath) 
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('نظام ميجا ستار لإدارة عمليات العمرة');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'إظهار التطبيق',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'إعادة فتح الخادم',
      click: () => {
        if (mainWindow) mainWindow.reload();
      }
    },
    { type: 'separator' },
    {
      label: 'إغلاق النهائيا',
      click: () => {
        if (mainWindow) {
          mainWindow.destroy();
        }
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers
ipcMain.handle('show-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, '../public/icon.png') }).show();
  }
});

ipcMain.handle('select-file', async (_, options) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [{ name: 'جميع الملفات', extensions: ['*'] }]
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('get-app-data-path', () => {
  return getAppDataDirectories();
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
