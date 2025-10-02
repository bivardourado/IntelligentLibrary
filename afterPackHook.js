// afterPackHook.js
const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  console.log('--- [Hook AfterPack] Iniciando a cópia manual do backend. ---');
  
  // O destino final continua sendo 'resources/server' dentro do app
  const destFolder = path.join(context.appOutDir, 'resources', 'server');
  
  // A ORIGEM MUDA AQUI: Procuramos o backend.exe dentro da pasta 'backend'
  const sourceFile = path.join(__dirname, 'backend', 'backend.exe');
  
  const destFile = path.join(destFolder, 'backend.exe');

  console.log(`[Hook AfterPack] Copiando de: ${sourceFile}`);
  console.log(`[Hook AfterPack] Para: ${destFile}`);

  try {
    if (!fs.existsSync(sourceFile)) {
      throw new Error('O arquivo de origem backend.exe não foi encontrado na pasta /backend!');
    }
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    fs.copyFileSync(sourceFile, destFile);
    console.log('[Hook AfterPack] ✅ backend.exe copiado com sucesso!');
  } catch (error) {
    console.error('[Hook AfterPack] ❌ ERRO CRÍTICO AO COPIAR O BACKEND:', error);
    throw error;
  }
}
