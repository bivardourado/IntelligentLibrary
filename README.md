# 📚 Intelligent Library

Transforme sua coleção de documentos PDF em uma biblioteca de pesquisa inteligente, permitindo conversas em linguagem natural com seus próprios arquivos.

## 🚀 Características

- **Privacidade Total**: Seus documentos ficam no seu computador
- **IA Avançada**: Usa GPT-4 para respostas precisas
- **BYOK (Bring Your Own Key)**: Use sua própria chave da OpenAI
- **Interface Intuitiva**: Chat simples e direto
- **Múltiplos PDFs**: Processa toda uma pasta de documentos
- **Citações Automáticas**: Mostra a fonte de cada resposta
- **Sistema de Licença**: Trial gratuito + assinatura anual

## 🎯 Execução Rápida

### Opção 1: Script Automático (Recomendado)
```bash
python run.py
```

### Opção 2: Manual
```bash
# 1. Instalar dependências Python
pip install -r requirements_atualizado.txt

# 2. Executar o aplicativo
python app_consolidado.py
```

## 📋 Requisitos

- **Python 3.8+** com pip
- **Chave OpenAI** (sua própria - BYOK)
- **PDFs** para processar

## 🛠️ Arquivos Principais

```
intelligent-library/
├── 🐍 app_consolidado.py      # Backend principal (executar este)
├── 🔐 license_manager.py      # Sistema de licenças
├── ⚡ main_corrigido.js      # Wrapper Electron (opcional)
├── 🌐 web/                   # Frontend HTML/CSS/JS
│   ├── index.html
│   ├── script.js
│   └── style.css
├── 🚀 run.py                 # Script de execução automática
└── 📋 requirements_atualizado.txt
```

## 🔧 Primeira Execução

1. **Execute**: `python run.py` ou `python app_consolidado.py`
2. **Configure**: Cole sua chave OpenAI na interface
3. **Carregue**: Selecione pasta com seus PDFs
4. **Use**: Faça perguntas sobre seus documentos

## 📊 Status do Desenvolvimento

### ✅ Concluído
- [x] Motor de busca vetorial com persistência
- [x] Interface web responsiva
- [x] Sistema de licenças offline (trial 7 dias)
- [x] Processamento de múltiplos PDFs
- [x] Backend consolidado com Eel
- [x] Frontend JavaScript completo

### 🚧 Próximos Passos
- [ ] Empacotamento Electron (.exe/.app)
- [ ] Auto-updater
- [ ] Suporte a DOCX/TXT
- [ ] Modo escuro

## 🐛 Solução de Problemas

### Erro: "Módulo não encontrado"
```bash
pip install -r requirements_atualizado.txt
```

### Erro: "Chave API inválida"
- Obtenha em [OpenAI Platform](https://platform.openai.com/api-keys)
- Deve começar com "sk-"

### Erro: "PDFs não carregam"
- Verifique se são PDFs válidos
- Tente com poucos arquivos primeiro

## 📄 Tecnologias

**Backend**: Python, LangChain, OpenAI, Qdrant, Eel
**Frontend**: HTML5, CSS3, JavaScript vanilla
**Desktop**: Electron (opcional)
**IA**: GPT-4 via OpenAI API

---

**Como usar**: Execute `python run.py` e siga as instruções na tela! 🚀
