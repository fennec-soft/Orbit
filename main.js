const { app, BrowserWindow, Menu, desktopCapturer } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let serverProcess = null;

function startServer() {
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = fork(serverPath);

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Meeting App',
    icon: path.join(__dirname, 'MEETING-APP.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Let the renderer's own screen-share button pick a screen (getDisplayMedia)
  // instead of relying on the legacy chromeMediaSource/mandatory constraint pattern.
  win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] })
      .then((sources) => {
        if (sources && sources.length > 0) {
          callback({ video: sources[0] });
        } else {
          callback({});
        }
      })
      .catch((err) => {
        console.error('Failed to get screen sources:', err);
        callback({});
      });
  });

  win.loadFile('login.html');
}

app.whenReady().then(() => {
  // Remove the default File/Edit/View/Window menu bar
  Menu.setApplicationMenu(null);

  startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});