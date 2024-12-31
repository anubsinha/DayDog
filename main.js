const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Datastore = require('nedb');

let mainWindow;
let db;

function createWindow() {
  // Log the user data path
  console.log('Application user data path:', app.getPath('userData'));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
  
  // Initialize database
  const dbPath = path.join(app.getPath('userData'), 'activities.db');
  console.log('Database path:', dbPath);
  
  db = new Datastore({
    filename: dbPath,
    autoload: true
  });

  // Open DevTools
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle activity logging
ipcMain.handle('log-activity', async (event, activity) => {
  return new Promise((resolve, reject) => {
    activity.timestamp = new Date();
    db.insert(activity, (err, newDoc) => {
      if (err) reject(err);
      resolve(newDoc);
    });
  });
});

// Get activities for visualization
ipcMain.handle('get-activities', async () => {
  return new Promise((resolve, reject) => {
    db.find({}).sort({ timestamp: -1 }).exec((err, docs) => {
      if (err) reject(err);
      console.log('Found activities:', docs); // Debug log
      resolve(docs);
    });
  });
});
