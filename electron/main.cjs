const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');

const isProd = app.isPackaged;
let mainWindow;
let pythonShell = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isProd) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:8080' );
    mainWindow.webContents.openDevTools();
  }
}

function startPythonBackend() {
  const scriptPath = isProd
    ? path.join(process.resourcesPath, 'app_consolidado.py')
    : path.join(__dirname, '../server/app_consolidado.py');

  pythonShell = new PythonShell(scriptPath, {
    pythonPath: isProd ? path.join(process.resourcesPath, 'python/python.exe') : 'python',
    cwd: path.dirname(scriptPath),
  });

  console.log(`[INFO] Iniciando backend Python: ${path.basename(scriptPath)} em ${path.dirname(scriptPath)}`);

  // --- A CORREÇÃO ESTÁ AQUI ---
  // Agora o log é mais inteligente.
  pythonShell.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      console.log('[PYTHON > ELECTRON] (JSON):', parsed);
      mainWindow.webContents.send('from-python', parsed);
    } catch (e) {
      // Se não for JSON, trata como uma mensagem de texto simples.
      console.log('[PYTHON > ELECTRON] (TEXT):', message);
    }
  });

  pythonShell.stderr.on('data', (data) => {
    // Qualquer coisa vinda do stderr agora é um LOG.
    console.log(`[PYTHON_LOG]: ${data}`);
  });

  pythonShell.on('close', () => {
    console.log('[INFO] Processo Python encerrado.');
  });

  pythonShell.on('error', (err) => {
    // Erros de verdade (ex: Python não encontrado) aparecerão aqui.
    console.error('[PYTHON_FATAL_ERROR]:', err);
  });
}

function stopPythonBackend() {
  if (pythonShell) {
    console.log('[INFO] Parando backend Python...');
    pythonShell.kill();
  }
}

ipcMain.on('to-python', (event, data) => {
  if (pythonShell) {
    console.log('[ELECTRON > PYTHON]:', data);
    pythonShell.send(JSON.stringify(data));
  }
});

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  stopPythonBackend();
});
