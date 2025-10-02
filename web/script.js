// web/script.js (VERSÃO PARA ELECTRON)

// --- Elementos da Tela ---
const setupScreen = document.getElementById('setup-screen');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKeyButton');
const apiError = document.getElementById('api-error');

const expiredScreen = document.getElementById('expired-screen');
const expiredMessage = document.getElementById('expired-message');
const licenseKeyInput = document.getElementById('licenseKeyInput');
const activateLicenseButton = document.getElementById('activateLicenseButton');
const licenseError = document.getElementById('license-error');

const chatScreen = document.getElementById('chat-screen');
const perguntaInput = document.getElementById('perguntaInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chat-messages');
const statusMessage = document.getElementById('status-message');

// Elementos para carregamento de documentos
const loadDocsScreen = document.getElementById('load-docs-screen');
const selectFolderButton = document.getElementById('selectFolderButton');
const selectedFolderPath = document.getElementById('selectedFolderPath');
const loadDocsStatus = document.getElementById('loadDocsStatus');

// --- Lógica de Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Iniciando Intelligent Library...');
        
        // Pergunta ao servidor Python qual é o estado atual do aplicativo
        const estado = await eel.verificar_estado_inicial()();
        const licInfo = estado.lic_info;

        console.log('📊 Estado atual:', estado.status);

        // Esconde todas as telas primeiro
        setupScreen.style.display = 'none';
        expiredScreen.style.display = 'none';
        chatScreen.style.display = 'none';
        loadDocsScreen.style.display = 'none';

        // Decide qual tela mostrar com base na resposta do servidor
        switch(estado.status) {
            case "NO_API_KEY":
                console.log('🔑 Chave API necessária');
                setupScreen.style.display = 'block';
                break;
                
            case "TRIAL_EXPIRED":
            case "LICENSE_EXPIRED":
                console.log('⏰ Licença expirada');
                expiredScreen.style.display = 'block';
                expiredMessage.innerText = licInfo.message;
                break;
                
            case "NO_DOCS":
                console.log('📄 Documentos necessários');
                loadDocsScreen.style.display = 'block';
                break;
                
            case "READY":
                console.log('✅ Sistema pronto');
                chatScreen.style.display = 'flex';
                statusMessage.innerText = licInfo.message;
                adicionarMensagem("Olá! Estou pronto para responder perguntas sobre seus documentos. O que gostaria de saber?", 'assistant');
                break;
                
            default:
                console.error('❌ Estado desconhecido:', estado.status);
                setupScreen.style.display = 'block';
                break;
        }
    } catch (error) {
        console.error("❌ Erro fatal na inicialização:", error);
        document.body.innerHTML = `
            <div class="error-container">
                <h1>❌ Erro Crítico de Conexão</h1>
                <p>Não foi possível se comunicar com o cérebro do aplicativo (servidor Python).</p>
                <p><strong>Possíveis causas:</strong></p>
                <ul>
                    <li>O servidor Python não iniciou corretamente.</li>
                    <li>Um firewall ou antivírus está bloqueando a conexão.</li>
                    <li>Dependências Python não foram instaladas.</li>
                </ul>
                <p>Por favor, verifique o terminal onde você iniciou o aplicativo para mais detalhes.</p>
                <button onclick="location.reload()">🔄 Tentar Novamente</button>
            </div>`;
    }
});

// --- Eventos ---

// Salvar API Key
if (saveApiKeyButton) {
    saveApiKeyButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            apiError.innerText = "Por favor, cole sua chave da API.";
            return;
        }
        
        if (!apiKey.startsWith("sk-")) {
            apiError.innerText = "Formato de chave inválido. A chave deve começar com 'sk-'.";
            return;
        }

        try {
            saveApiKeyButton.disabled = true;
            saveApiKeyButton.innerText = "Salvando...";
            
            const success = await eel.salvar_api_key(apiKey)();
            
            if (success) {
                alert("✅ Chave da API salva com sucesso! O aplicativo será reiniciado para aplicar as mudanças.");
                location.reload();
            } else {
                apiError.innerText = "❌ Não foi possível salvar a chave.";
            }
        } catch (error) {
            console.error("Erro ao salvar API key:", error);
            apiError.innerText = "❌ Erro de comunicação com o servidor.";
        } finally {
            saveApiKeyButton.disabled = false;
            saveApiKeyButton.innerText = "Salvar Chave e Continuar";
        }
    });
}

// Ativar Licença
if (activateLicenseButton) {
    activateLicenseButton.addEventListener('click', async () => {
        const licenseKey = licenseKeyInput.value.trim();
        
        if (!licenseKey) {
            licenseError.innerText = "Por favor, cole sua chave de licença.";
            return;
        }

        try {
            activateLicenseButton.disabled = true;
            activateLicenseButton.innerText = "Ativando...";
            
            const result = await eel.tentar_ativar_licenca(licenseKey)();
            
            if (result.success) {
                alert(`✅ ${result.message}`);
                location.reload();
            } else {
                licenseError.innerText = `❌ ${result.message}`;
            }
        } catch (error) {
            console.error("Erro ao ativar licença:", error);
            licenseError.innerText = "❌ Erro de comunicação com o servidor.";
        } finally {
            activateLicenseButton.disabled = false;
            activateLicenseButton.innerText = "Ativar Licença";
        }
    });
}

// Selecionar pasta de documentos
if (selectFolderButton) {
    selectFolderButton.addEventListener('click', async () => {
        try {
            selectFolderButton.disabled = true;
            selectFolderButton.innerText = "Abrindo seletor...";
            
            const folderPath = await eel.select_pdf_folder()();
            
            if (folderPath) {
                selectedFolderPath.innerText = `📁 Pasta selecionada: ${folderPath}`;
                loadDocsStatus.innerText = '🔄 Processando documentos...';
                loadDocsStatus.className = 'status-message processing';
                
                const result = await eel.carregar_documentos(folderPath)();
                
                if (result.success) {
                    loadDocsStatus.innerText = `✅ ${result.message}`;
                    loadDocsStatus.className = 'status-message success';
                    
                    // Transiciona para a tela de chat após o carregamento
                    setTimeout(() => {
                        loadDocsScreen.style.display = 'none';
                        chatScreen.style.display = 'flex';
                        adicionarMensagem("📚 Documentos carregados com sucesso! Faça sua primeira pergunta.", 'assistant');
                        perguntaInput.focus();
                    }, 2000);
                } else {
                    loadDocsStatus.innerText = `❌ Erro: ${result.message}`;
                    loadDocsStatus.className = 'status-message error';
                }
            } else {
                selectedFolderPath.innerText = '❌ Nenhuma pasta selecionada.';
            }
        } catch (error) {
            console.error("Erro ao selecionar pasta:", error);
            loadDocsStatus.innerText = "❌ Erro de comunicação com o servidor.";
            loadDocsStatus.className = 'status-message error';
        } finally {
            selectFolderButton.disabled = false;
            selectFolderButton.innerText = "Selecionar Pasta de PDFs";
        }
    });
}

// Enviar pergunta
if (sendButton) sendButton.addEventListener('click', enviarPergunta);
if (perguntaInput) {
    perguntaInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarPergunta();
        }
    });
}

// --- Funções do Chat ---

function adicionarMensagem(texto, tipo) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${tipo}-message`);
    
    // Converte Markdown simples e quebras de linha para HTML
    let html = texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = html;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Adiciona animação de entrada
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    });
    
    return messageDiv;
}

async function enviarPergunta() {
    const pergunta = perguntaInput.value.trim();
    if (pergunta === "") return;

    // Adiciona a pergunta do usuário
    adicionarMensagem(pergunta, 'user');
    perguntaInput.value = "";
    perguntaInput.disabled = true;
    sendButton.disabled = true;

    // Adiciona mensagem de "pensando"
    const thinkingMessage = adicionarMensagem("🧠 Analisando seus documentos...", 'assistant');
    
    try {
        // Chamada para o backend Python
        const resultado = await eel.processar_pergunta(pergunta)();

        // Remove a mensagem de "pensando"
        thinkingMessage.remove();

        // Adiciona a resposta
        if (resultado.answer) {
            adicionarMensagem(resultado.answer, 'assistant');
        } else {
            adicionarMensagem("❌ Não consegui processar sua pergunta. Tente reformulá-la.", 'assistant');
        }
        
    } catch (error) {
        console.error("Erro ao processar pergunta:", error);
        thinkingMessage.innerHTML = "❌ Ocorreu um erro ao contatar o cérebro do aplicativo. Verifique o terminal para mais detalhes.";
    } finally {
        perguntaInput.disabled = false;
        sendButton.disabled = false;
        perguntaInput.focus();
    }
}

// --- Utilitários ---

// Detecta se o usuário está online (útil para futuras funcionalidades)
window.addEventListener('online', () => {
    console.log('🌐 Conexão com a internet restaurada');
});

window.addEventListener('offline', () => {
    console.log('📡 Sem conexão com a internet (modo offline)');
});

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl+R ou F5 para recarregar
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        location.reload();
    }
    
    // Escape para limpar input
    if (e.key === 'Escape' && perguntaInput) {
        perguntaInput.value = '';
        perguntaInput.focus();
    }
});

console.log('✅ Script carregado com sucesso!');