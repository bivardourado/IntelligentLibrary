import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, Loader2, BookOpen, Trash2, KeyRound, CheckCircle2, File as FileIcon, X, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload from '@/components/FileUpload';

// Declara para o TypeScript que a função 'eel' pode existir no 'window'
declare global {
  interface Window {
    eel: any;
  }
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  sources?: string[];
}

export default function Index() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeySet(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefaults, false);
    window.addEventListener('drop', preventDefaults, false);
    return () => {
      window.removeEventListener('dragover', preventDefaults, false);
      window.removeEventListener('drop', preventDefaults, false);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      acceptedFiles.forEach(newFile => {
        if (!newFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)) {
          newFiles.push(newFile);
        }
      });
      return newFiles;
    });
  }, []);

  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim().startsWith('sk-')) {
      localStorage.setItem('openai_api_key', apiKey);
      setIsApiKeySet(true);
      setError(null);
    } else {
      setError('Chave da API inválida. Deve começar com "sk-".');
    }
  };

  // ==================================================================
  // CORREÇÃO 1: USANDO A PONTE EEL PARA UPLOAD
  // ==================================================================
  const handleUploadAndInitialize = async () => {
    if (files.length === 0) {
      setError("Por favor, selecione pelo menos um arquivo PDF.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // O Eel não transfere o objeto 'File' inteiro.
      // A sua função Python 'carregar_documentos' espera o CAMINHO DA PASTA.
      // Vamos pegar o caminho da pasta do primeiro arquivo.
      const firstFile = files[0] as any;
      if (!firstFile || !firstFile.path) {
        throw new Error("Não foi possível obter o caminho do arquivo. O Drag-and-Drop pode não funcionar no navegador.");
      }
      const folderPath = firstFile.path.substring(0, firstFile.path.lastIndexOf('\\'));

      // Chama a função Python 'carregar_documentos' diretamente!
      const result = await window.eel.carregar_documentos(folderPath)();

      if (!result.success) {
        throw new Error(result.message || 'Falha ao processar os documentos no backend.');
      }

      console.log('Backend response:', result.message);
      setIsReady(true);
      setMessages([{ id: Date.now(), text: `${files.length} documento(s) carregado(s) com sucesso! Pode começar a perguntar.`, sender: 'bot' }]);

    } catch (err: any) {
      setError(err.message || 'Não foi possível conectar ao backend. Verifique se o servidor Python está rodando.');
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================================================================
  // CORREÇÃO 2: USANDO A PONTE EEL PARA FAZER PERGUNTAS
  // ==================================================================
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !isReady) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Chama a função Python 'processar_pergunta' diretamente!
      const data = await window.eel.processar_pergunta(currentInput, apiKey)();

      if (data.error) {
        throw new Error(data.error);
      }
      
      const answerParts = data.answer.split('Fontes:');
      const botText = answerParts[0].trim();
      const sourcesText = answerParts.length > 1 ? answerParts[1].trim().split('\n').filter(s => s.trim() !== '') : undefined;

      const botMessage: Message = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        sources: sourcesText,
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (err: any) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: `Erro: ${err.message}`,
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setIsApiKeySet(false);
    setMessages([]);
    setFiles([]);
    setIsReady(false);
    setError(null);
  }

  // O resto do seu componente continua igual...
  // TELA DE BOAS-VINDAS
  if (!isApiKeySet) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Bem-vindo ao Intelligent Library
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Transforme seus PDFs em uma biblioteca inteligente
              </p>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Configure sua Chave da OpenAI
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Para que a inteligência artificial funcione, cole sua chave da API da OpenAI abaixo. Seus dados e custos são gerenciados por você.
              </p>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                className="bg-white dark:bg-gray-800"
                placeholder="Cole sua chave (sk-...) aqui"
              />
              <Button onClick={handleApiKeySubmit} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white">
                Salvar Chave e Continuar
              </Button>
              {error && <p className="text-xs text-center text-red-600 pt-2">{error}</p>}
            </div>

            <div className="text-center pt-4">
              <Button onClick={handleReset} variant="link" className="text-xs text-center text-gray-500 hover:text-red-600">
                 Resetar Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TELA DE UPLOAD
  if (!isReady) {
    return (
       <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="w-full max-w-2xl p-8 space-y-6 text-center">
          
          <Upload className="w-12 h-12 mx-auto text-gray-800 dark:text-gray-200" />

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Carregue seus Documentos PDF
          </h1>
          <p className="text-md text-gray-500 dark:text-gray-400">
            Arrastar e soltar ou clique para selecionar arquivos PDF (máx. 5MB cada)
          </p>

          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chave da OpenAI configurada</span>
            </div>
            <Badge variant="secondary">Trial: 7 dias</Badge>
          </div>
          
          <FileUpload onDrop={onDrop} />

          {files.length > 0 && (
            <div className="space-y-2 text-left">
              <h4 className="font-medium">Arquivos Selecionados:</h4>
              <ul className="space-y-2">
                {files.map(file => (
                  <li key={file.name} className="flex items-center justify-between p-2 bg-gray-100 rounded-md dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <FileIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <button onClick={() => removeFile(file.name)} className="p-1 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {files.length > 0 && (
            <Button onClick={handleUploadAndInitialize} disabled={isLoading} className="w-full text-base py-6 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Carregar ${files.length} Arquivo(s) e Iniciar`}
            </Button>
          )}

          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          
          <div className="pt-4">
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-4 text-left">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Chave configurada</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sua chave da OpenAI foi salva com sucesso!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // TELA DE CHAT
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
              {message.sender === 'bot' && (
                <Avatar>
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-xl p-3 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className='mt-3 pt-2 border-t border-gray-300 dark:border-gray-700'>
                    <h4 className='text-xs font-semibold mb-1'>Fontes:</h4>
                    <div className='space-y-1'>
                      {message.sources.map((source, index) => (
                        <Badge key={index} variant="secondary">{source}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {message.sender === 'user' && (
                <Avatar>
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <div className="max-w-xl p-3 bg-gray-200 rounded-lg dark:bg-gray-800">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
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

