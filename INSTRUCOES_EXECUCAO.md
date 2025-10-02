# 🚀 Como Executar o Intelligent Library

## ⚡ Execução Rápida (Recomendado)

### 1. Preparar o Ambiente
```bash
# Instalar dependências Python
pip install -r requirements_atualizado.txt

# Instalar dependências Node.js
npm install
```

### 2. Executar o Aplicativo
```bash
# Modo mais simples - tudo junto
npm start
```

## 🔧 Execução Detalhada (Para Debug)

### Opção A: Backend + Frontend Separados
```bash
# Terminal 1: Iniciar backend Python
python app_consolidado.py

# Terminal 2: Iniciar Electron (em nova aba/janela)
npm run dev
```

### Opção B: Apenas Backend (Para Testes)
```bash
# Apenas o motor Python (sem interface)
python app_consolidado.py
# Depois acesse: http://localhost:8000
```

## 📋 Checklist Antes de Executar

- [ ] Python 3.8+ instalado
- [ ] pip atualizado (`pip install --upgrade pip`)
- [ ] Node.js 16+ instalado
- [ ] Todas as dependências instaladas
- [ ] Pasta com PDFs preparada
- [ ] Chave OpenAI em mãos

## 🛠️ Primeira Execução - Passo a Passo

### 1. Ao abrir o app:
- Coloque sua chave OpenAI (sk-...)
- Clique "Salvar Chave e Continuar"

### 2. Carregamento de documentos:
- Clique "Selecionar Pasta de PDFs"
- Escolha a pasta com seus arquivos
- Aguarde o processamento (pode demorar alguns minutos)

### 3. Começar a usar:
- Digite sua primeira pergunta
- Aguarde a resposta com citações
- Continue conversando!

## ⚠️ Problemas Comuns

### "Erro ao importar módulo X"
```bash
pip install -r requirements_atualizado.txt --force-reinstall
```

### "Python não encontrado"
- Windows: Instalar do [python.org](https://python.org) e marcar "Add to PATH"
- macOS: `brew install python3`
- Linux: `sudo apt install python3 python3-pip`

### "Electron não inicia"
```bash
npm install --save-dev electron
npm run dev
```

### "Backend não conecta"
- Verifique se não há outro programa usando a porta 8000
- Tente reiniciar o aplicativo
- Confira os logs no terminal

## 📊 Monitoramento

### Logs Importantes
- **Backend Python**: Terminal onde rodou `python app_consolidado.py`
- **Frontend Electron**: Console do DevTools (F12)
- **Arquivos de log**: Pasta do usuário (se configurado)

### Performance
- **Primeira carga**: 2-5 minutos (processa PDFs)
- **Perguntas**: 3-10 segundos
- **Uso de RAM**: ~500MB - 2GB (depende do tamanho dos PDFs)

## 🎯 Modos de Execução

### Desenvolvimento
```bash
npm run dev
# - DevTools aberto
# - Logs detalhados
# - Hot reload
```

### Produção
```bash
npm start
# - Interface limpa
# - Performance otimizada
# - Logs mínimos
```

### Build
```bash
npm run build-win  # Windows
npm run build-mac  # macOS
# Gera executável na pasta dist/
```

## 🔄 Reinicialização

Se algo der errado:

1. **Feche tudo** (Ctrl+C nos terminais)
2. **Limpe caches**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. **Reinicie**:
   ```bash
   npm start
   ```

## 📞 Debug Avançado

### Logs detalhados
```bash
# Backend com debug
python app_consolidado.py --debug

# Electron com logs completos
npm run dev -- --verbose
```

### Testar componentes isoladamente
```bash
# Testar apenas o motor de busca
python -c "from app_consolidado import *; # teste aqui"

# Testar apenas a interface
cd web && python -m http.server 8080
```

---
✅ **Dica**: Execute sempre em modo desenvolvimento primeiro para identificar problemas antes de fazer o build final!