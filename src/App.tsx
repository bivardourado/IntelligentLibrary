import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, BookOpen, Trash2, KeyRound, FolderUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    api: {
      send: (channel: 'to-python', data: { action: string; data?: any }) => void;
      on: (channel: 'from-python', func: (response: any) => void) => void;
    };
  }
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  sources?: string[];
}

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Aguardando ação...');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.api) {
      const handleFromPython = (response: any) => {
        console.log('[FRONTEND] Recebido do Python:', response);
        setIsLoading(false);

        if (response.status === 'error') {
          setError(response.message);
          return;
        }

        switch (response.action) {
          case 'verificar_estado_inicial':
            if (response.result.status === 'NOT_READY') {
              const storedApiKey = localStorage.getItem('openai_api_key');
              if (storedApiKey) {
                setApiKey(storedApiKey);
                window.api.send('to-python', { action: 'salvar_e_validar_chave', data: storedApiKey });
              }
            }
            break;
          case 'salvar_e_validar_chave':
            if (response.result.success) {
              setIsApiKeySet(true);
              setError(null);
            } else {
              setError(response.result.message);
              localStorage.removeItem('openai_api_key');
              setApiKey('');
            }
            break;
          case 'select_pdf_files':
            if (response.result && response.result.length > 0) {
              setStatusMessage(`Processando ${response.result.length} arquivo(s)...`);
              setIsLoading(true);
              // --- A CORREÇÃO FINAL ESTÁ AQUI ---
              // Agora estamos enviando a chave correta que está no estado 'apiKey'
              window.api.send('to-python', {
                action: 'carregar_documentos',
                data: {
                  filePaths: response.result,
                  apiKey: apiKey
                }
              });
            } else {
              setIsLoading(false);
              setStatusMessage('Aguardando ação...');
            }
            break;
          case 'carregar_documentos':
            if (response.result.success) {
              setIsReady(true);
              setMessages([{ id: Date.now(), text: response.result.message, sender: 'bot' }]);
            } else {
              setError(response.result.message);
            }
            break;
          case 'processar_pergunta':
            const data = response.result;
            if (data.error) {
              const errorMessage: Message = { id: Date.now() + 1, text: `Erro: ${data.error}`, sender: 'bot' };
              setMessages(prev => [...prev, errorMessage]);
            } else {
              const answerParts = data.answer.split('Fontes:');
              const botText = answerParts[0].trim();
              const sourcesText = answerParts.length > 1 ? answerParts[1].trim().split('\n').filter(s => s.trim() !== '') : undefined;
              const botMessage: Message = { id: Date.now() + 1, text: botText, sender: 'bot', sources: sourcesText };
              setMessages(prev => [...prev, botMessage]);
            }
            break;
        }
      };

      window.api.on('from-python', handleFromPython);
      window.api.send('to-python', { action: 'verificar_estado_inicial' });

    } else {
      console.error("API do Electron não encontrada.");
      setError("Erro Crítico: A aplicação deve ser executada através do Electron.");
    }
  }, [apiKey]); // Depender de 'apiKey' é importante aqui

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleApiKeySubmit = () => {
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey) {
      setError("O campo da chave não pode estar vazio.");
      return;
    }
    setIsLoading(true);
    setStatusMessage('Salvando e validando a chave...');
    setError(null);
    window.api.send('to-python', { action: 'salvar_e_validar_chave', data: trimmedApiKey });
  };

  const handleSelectFiles = () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('Aguardando seleção de arquivos...');
    window.api.send('to-python', { action: 'select_pdf_files' });
  };

  const handleSendMessage = () => {
    if (!input.trim() || isLoading || !isReady) return;
    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);
    window.api.send('to-python', { action: 'processar_pergunta', data: { pergunta: currentInput } });
  };

  const handleReset = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setIsApiKeySet(false);
    setMessages([]);
    setIsReady(false);
    setError(null);
  };

  if (!isApiKeySet) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bem-vindo ao Intelligent Library</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transforme seus PDFs em uma biblioteca inteligente</p>
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Configure sua Chave da OpenAI</h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Para que a inteligência artificial funcione, cole sua chave da API da OpenAI abaixo.</p>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                className="bg-white dark:bg-gray-800"
                placeholder="Cole sua chave (sk-...) aqui"
              />
              <Button onClick={handleApiKeySubmit} disabled={isLoading} className="w-full py-5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar e Validar Chave'}
              </Button>
              {error && <p className="text-xs text-center text-red-600 pt-2">{error}</p>}
            </div>
            <div className="text-center pt-4">
              <Button onClick={handleReset} variant="link" className="text-xs text-center text-gray-500 hover:text-red-600">Resetar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-700 dark:text-gray-300" />
            <CardTitle className="mt-4">Carregue seus Documentos</CardTitle>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Selecione os arquivos PDF que o Manus deve estudar.</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-md dark:border-gray-700">
              <Button onClick={handleSelectFiles} disabled={isLoading} className="w-full mt-4 flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderUp className="w-5 h-5" />}
                {isLoading ? statusMessage : 'Selecionar Arquivos PDF'}
              </Button>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
            <Button onClick={handleReset} variant="link" className="w-full mt-2 text-xs text-center text-gray-500 hover:text-red-600">Resetar e trocar chave</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <div className='flex items-center space-x-2'>
          <BookOpen className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h1 className="text-xl font-bold">Intelligent Library</h1>
        </div>
        <Button onClick={handleReset} variant="outline" size="sm" className='flex items-center space-x-2'>
          <Trash2 className="w-4 h-4" />
          <span>Resetar Sessão</span>
        </Button>
      </header>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
              {message.sender === 'bot' && <Avatar><AvatarFallback>M</AvatarFallback></Avatar>}
              <div className={`max-w-xl p-3 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className='mt-3 pt-2 border-t border-gray-300 dark:border-gray-700'>
                    <h4 className='text-xs font-semibold mb-1'>Fontes:</h4>
                    <div className='space-y-1'>
                      {message.sources.map((source, index) => <Badge key={index} variant="secondary">{source}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
              {message.sender === 'user' && <Avatar><AvatarFallback><User /></AvatarFallback></Avatar>}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar><AvatarFallback>M</AvatarFallback></Avatar>
              <div className="max-w-xl p-3 bg-gray-200 rounded-lg dark:bg-gray-800"><Loader2 className="w-5 h-5 animate-spin" /></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t dark:border-gray-800">
        <div className="relative">
          <Input
            placeholder="Faça uma pergunta sobre seus documentos..."
            className="pr-12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={!isReady || isLoading}
          />
          <Button size="icon" className="absolute top-1/2 right-2 -translate-y-1/2" onClick={handleSendMessage} disabled={!isReady || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
