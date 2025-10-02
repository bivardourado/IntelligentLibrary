# 🚀 Como Executar o App Electron

## Desenvolvimento

Para executar em modo desenvolvimento:

```bash
# Terminal 1: Iniciar o servidor Vite
npm run dev

# Terminal 2: Iniciar o Electron (aguarde o Vite iniciar primeiro)
npx electron electron/main.js
```

## Scripts Recomendados

Adicione estes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "electron": "NODE_ENV=development npx electron electron/main.js",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && npx electron electron/main.js\"",
    "electron:build": "npm run build && npx electron electron/main.js",
    "electron:pack": "npm run build && npx electron-builder",
    "electron:dist": "npm run build && npx electron-builder --publish=never"
  }
}
```

## Dependências Adicionais (Opcional)

Para melhor experiência de desenvolvimento:

```bash
npm install --save-dev concurrently wait-on
```

## Produção

1. **Build da aplicação:**
   ```bash
   npm run build
   ```

2. **Executar Electron em produção:**
   ```bash
   npx electron electron/main.js
   ```

3. **Criar executável:**
   ```bash
   npx electron-builder
   ```

## Estrutura de Arquivos

```
├── electron/
│   └── main.js          # Processo principal do Electron
├── dist/                # Build da aplicação React (gerado)
├── electron-builder.config.js  # Configuração do Electron Builder
└── package.json         # Scripts e dependências
```

## Características

- ✅ **Hot Reload** em desenvolvimento
- ✅ **DevTools** automático em dev
- ✅ **Build otimizado** para produção
- ✅ **Multiplataforma** (Windows, Mac, Linux)
- ✅ **Auto-updater** ready (configuração adicional necessária)

## Problemas Comuns

1. **Porta 8080 ocupada**: Mude a porta no `vite.config.ts` e `electron/main.js`
2. **Electron não encontra a aplicação**: Aguarde o Vite inicializar completamente
3. **Arquivos estáticos não carregam**: Verifique se `base: './'` está no vite.config.ts