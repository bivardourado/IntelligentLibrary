// main.js (VERSÃO CORRIGIDA PARA ELECTRON)

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pythonProcess = null;
let mainWindow = null;

function createWindow() {
    console.log('🖥️ Criando janela principal do Electron...');
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // Opcional, para futura comunicação segura
        },
        icon: path.join(__dirname, 'assets', 'icon.png'), // Opcional: ícone do app
        titleBarStyle: 'default',
        show: false // Não mostra até estar pronto
    });

    // Aguarda o processo Python estar rodando antes de carregar a página
    console.log('⏳ Aguardando backend Python ficar pronto...');
    
    // Tenta conectar ao servidor local várias vezes
    const tryConnect = () => {
        // Carrega a interface web local
        mainWindow.loadURL('http://localhost:8000');
        
        mainWindow.webContents.once('did-finish-load', () => {
            console.log('✅ Interface carregada com sucesso!');
            mainWindow.show();
        });
        
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.log(`⚠️ Falha ao carregar (${errorCode}): ${errorDescription}`);
            console.log('🔄 Tentando novamente em 2 segundos...');
            setTimeout(tryConnect, 2000);
        });
    };
    
    // Aguarda 3 segundos para o Python inicializar, depois tenta conectar
    setTimeout(tryConnect, 3000);

    // Ferramentas de desenvolvedor (descomente para debug)
    // mainWindow.webContents.openDevTools();
}

function startPythonBackend() {
    console.log('🐍 Iniciando servidor Python...');
    
    // Determina o executável Python correto
    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
    
    // Caminho para o script principal (app.py consolidado)
    const scriptPath = path.join(__dirname, 'app_consolidado.py');
    
    console.log(`📂 Executando: ${pythonExecutable} "${scriptPath}"`);
    
    pythonProcess = spawn(pythonExecutable, [scriptPath], {
        cwd: __dirname,
        stdio: ['inherit', 'pipe', 'pipe']
    });

    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[🧠 Python Backend]: ${output.trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[❌ Python Error]: ${error.trim()}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`🔚 Processo Python encerrado com código: ${code}`);
        if (code !== 0) {
            console.error('⚠️ O backend Python encerrou com erro!');
        }
    });

    pythonProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar processo Python:', error);
        
        // Mostra erro para o usuário
        const { dialog } = require('electron');
        dialog.showErrorBox(
            'Erro Crítico', 
            `Não foi possível iniciar o backend Python:\n\n${error.message}\n\nVerifique se o Python está instalado e as dependências foram instaladas com:\n\npip install -r requirements.txt`
        );
    });
}

function killPythonProcess() {
    if (pythonProcess) {
        console.log('🛑 Encerrando processo Python...');
        pythonProcess.kill('SIGTERM');
        
        // Força encerramento após 5 segundos se necessário
        setTimeout(() => {
            if (pythonProcess && !pythonProcess.killed) {
                console.log('⚠️ Forçando encerramento do Python...');
                pythonProcess.kill('SIGKILL');
            }
        }, 5000);
    }
}

// --- Eventos do Electron ---

app.whenReady().then(() => {
    console.log('🚀 Electron pronto! Iniciando Intelligent Library...');
    
    startPythonBackend();
    createWindow();

    app.on('activate', () => {
        // No macOS, re-cria a janela quando o ícone do dock é clicado
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    console.log('🪟 Todas as janelas foram fechadas');
    killPythonProcess();
    
    // No macOS, mantém o app ativo mesmo sem janelas
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    console.log('🔄 Aplicativo sendo encerrado...');
    killPythonProcess();
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    killPythonProcess();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    killPythonProcess();
});