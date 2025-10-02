const { contextBridge, ipcRenderer } = require('electron');

// O "contextBridge" é a ponte segura entre o mundo do Electron (Node.js)
// e o mundo do seu frontend (React).

contextBridge.exposeInMainWorld(
  // O nome que daremos à nossa API no frontend.
  // Poderemos chamar as funções como: window.api.send(...)
  'api', 
  {
    /**
     * Envia uma mensagem do Frontend para o Main Process.
     * @param {string} channel - O canal para o qual enviar (ex: 'to-python').
     * @param {*} data - Os dados a serem enviados (um objeto JSON).
     */
    send: (channel, data) => {
      // Lista de canais permitidos para envio (por segurança)
      const validChannels = ['to-python'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },

    /**
     * Registra um "ouvinte" para receber mensagens do Main Process.
     * @param {string} channel - O canal do qual receber (ex: 'from-python').
     * @param {Function} func - A função (callback) a ser executada quando uma mensagem chegar.
     */
    on: (channel, func) => {
      const validChannels = ['from-python'];
      if (validChannels.includes(channel)) {
        // Remove listeners antigos para evitar duplicação e vazamento de memória
        ipcRenderer.removeAllListeners(channel);
        // Registra o novo listener que chama a função fornecida
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);
