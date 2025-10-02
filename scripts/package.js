// scripts/package.js
const fs = require('fs-extra'); // Usaremos fs-extra para cópias robustas
const path = require('path');
const { exec } = require('child_process');

async function main() {
  console.log('--- INICIANDO PROCESSO DE EMPACOTAMENTO MANUAL ---');

  const projectRoot = path.join(__dirname, '..');
  const sourceBackend = path.join(projectRoot, 'backend', 'backend.exe');
  const prepFolder = path.join(projectRoot, 'build-assets');
  const destBackendFolder = path.join(prepFolder, 'server');
  const destBackendFile = path.join(destBackendFolder, 'backend.exe');

  try {
    // 1. Limpa e cria a pasta de preparação
    console.log('1/3: Limpando a área de preparação (build-assets)...');
    await fs.emptyDir(prepFolder);
    await fs.ensureDir(destBackendFolder);

    // 2. Copia o backend.exe para a pasta de preparação
    console.log(`2/3: Copiando backend.exe para ${destBackendFile}...`);
    if (!fs.existsSync(sourceBackend)) {
      throw new Error(`ARQUIVO DE ORIGEM NÃO ENCONTRADO: ${sourceBackend}`);
    }
    await fs.copy(sourceBackend, destBackendFile);
    console.log('   ✅ Cópia do backend concluída.');

    // 3. Executa o electron-builder
    console.log('3/3: Executando o electron-builder...');
    const builderProcess = exec('electron-builder --win --x64', { cwd: projectRoot });

    // Mostra a saída do electron-builder em tempo real
    builderProcess.stdout.pipe(process.stdout);
    builderProcess.stderr.pipe(process.stderr);

    builderProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n--- ✅ PROCESSO DE EMPACOTAMENTO CONCLUÍDO COM SUCESSO! ---');
      } else {
        console.error(`\n--- ❌ ERRO: O electron-builder falhou com o código ${code}. ---`);
      }
    });

  } catch (error) {
    console.error('--- ❌ ERRO CRÍTICO NO SCRIPT DE EMPACOTAMENTO ---');
    console.error(error);
    process.exit(1); // Encerra o processo com erro
  }
}

main();
