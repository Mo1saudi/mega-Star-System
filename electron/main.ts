import { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, Notification } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getAppDataDirectories() {
  const userAppData = app.getPath('userData');
  const dirs = {
    userData: userAppData,
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

const getDbFilePath = () => {
  const dirs = getAppDataDirectories();
  return path.join(dirs.database, 'megastar_db.json');
};

function createWindow() {
  const dirs = getAppDataDirectories();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 850,
    minWidth: 1024,
    minHeight: 650,
    title: 'ميجا ستار - إدارة عمليات العمرة',
    icon: path.join(__dirname, '../public/icon.ico'),
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      webSecurity: false
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
      label: 'إظهار التطبيق الرئيسي',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'إعادة تحميل الواجهة',
      click: () => {
        if (mainWindow) mainWindow.reload();
      }
    },
    { type: 'separator' },
    {
      label: 'إغلاق النظام نهائياً',
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

// Database IPC Handlers (Persistent File/SQLite store in AppData/Database)
ipcMain.handle('db-read', async () => {
  try {
    const dbPath = getDbFilePath();
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf-8');
      if (content && content.trim().length > 0) {
        return JSON.parse(content);
      }
    }
    return null;
  } catch (err) {
    console.error('Electron DB Read Error:', err);
    return null;
  }
});

ipcMain.handle('db-write', async (_, snapshot) => {
  try {
    const dirs = getAppDataDirectories();
    const dbPath = getDbFilePath();
    
    // Save to primary DB file
    fs.writeFileSync(dbPath, JSON.stringify(snapshot, null, 2), 'utf-8');

    // Create periodic automatic backup file in AppData/Backups
    const backupPath = path.join(dirs.backups, `megastar_backup_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), 'utf-8');

    return true;
  } catch (err) {
    console.error('Electron DB Write Error:', err);
    return false;
  }
});

// Utility IPC Handlers
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
