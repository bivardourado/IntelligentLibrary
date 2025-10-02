#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Intelligent Library como App Electron...\n');

// Definir ambiente de desenvolvimento
process.env.NODE_ENV = 'development';
process.env.ELECTRON_BUILD = 'true';

// Iniciar Vite primeiro
console.log('📦 Iniciando servidor Vite...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: process.platform === 'win32'
});

let viteReady = false;

viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Vite] ${output.trim()}`);
  
  // Detecta quando o Vite está pronto
  if (output.includes('Local:') && !viteReady) {
    viteReady = true;
    startElectron();
  }
});

viteProcess.stderr.on('data', (data) => {
  console.error(`[Vite Error] ${data.toString().trim()}`);
});

function startElectron() {
  console.log('\n⚡ Vite pronto! Iniciando Electron...\n');
  
  setTimeout(() => {
    const electronProcess = spawn('npx', ['electron', 'electron/main.js'], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    electronProcess.on('close', (code) => {
      console.log(`\n🔚 Electron encerrado (código: ${code})`);
      console.log('🛑 Parando Vite...');
      viteProcess.kill();
      process.exit(code);
    });
  }, 2000);
}

// Tratamento de interrupção (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando aplicação...');
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit(0);
});