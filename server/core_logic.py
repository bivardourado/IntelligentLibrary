import sys
import os
import shutil
import traceback
import logging
from tqdm import tqdm

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import SentenceTransformerEmbeddings

def setup_logging():
    logging.basicConfig(level=logging.ERROR)
    logging.getLogger('langchain').setLevel(logging.ERROR)
    logging.getLogger('huggingface_hub').setLevel(logging.ERROR)
    sys.stderr.write("[CORE_LOGIC] Logging configurado para suprimir avisos.\n")
    sys.stderr.flush()

def log_message(message):
    sys.stderr.write(f"[PYTHON_LOG] {message}\n")
    sys.stderr.flush()

def check_openai_api_key(api_key: str) -> tuple[bool, str]:
    if not api_key or not isinstance(api_key, str):
        return False, "Chave da API não fornecida ou em formato inválido."
    if not api_key.startswith('sk-'):
        return False, "Formato de chave inválido. Deve começar com 'sk-'."
    try:
        ChatOpenAI(openai_api_key=api_key).invoke("test")
        return True, "Chave da API válida."
    except Exception as e:
        if "authentication" in str(e).lower():
            return False, "Chave da API da OpenAI inválida ou expirada."
        return False, f"Erro ao validar a chave: {e}"

class AgentManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AgentManager, cls).__new__(cls)
            cls._instance.agent_executor = None
            cls._instance.base_dir = os.path.dirname(os.path.abspath(__file__))
            cls._instance.docs_path = os.path.join(cls._instance.base_dir, "documents")
            cls._instance.db_path = os.path.join(cls._instance.base_dir, "db_storage")
            cache_dir = os.path.join(cls._instance.base_dir, 'embedding_cache')
            os.makedirs(cache_dir, exist_ok=True)
            cls._instance.embeddings = SentenceTransformerEmbeddings(
                model_name="paraphrase-multilingual-MiniLM-L12-v2",
                cache_folder=cache_dir
            )
            sys.stderr.write("[CORE_LOGIC] Nova instancia do AgentManager criada.\n")
            sys.stderr.flush()
        return cls._instance

    def is_initialized(self):
        return self.agent_executor is not None

    def initialize_agent(self, api_key: str):
        try:
            # --- Início do Bloco de Confiança ---

            sys.stderr.write("[CORE_LOGIC] Verificando validade da chave da API...\n")
            is_valid, message = check_openai_api_key(api_key)
            if not is_valid:
                raise ValueError(message)
            sys.stderr.write("[CORE_LOGIC] Chave da API é válida.\n")

            sys.stderr.write("[CORE_LOGIC] Verificando documentos...\n")
            os.makedirs(self.docs_path, exist_ok=True)
            pdf_files = [f for f in os.listdir(self.docs_path) if f.lower().endswith(".pdf")]
            if not pdf_files:
                raise FileNotFoundError("Nenhum arquivo PDF encontrado na pasta de documentos internos.")

            all_docs = []
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            for pdf_file in tqdm(pdf_files, desc="[CORE_LOGIC] Processando PDFs", file=sys.stderr):
                loader = PyPDFLoader(os.path.join(self.docs_path, pdf_file))
                docs = loader.load()
                for doc in docs:
                    doc.metadata["source"] = os.path.basename(pdf_file)
                all_docs.extend(text_splitter.split_documents(docs))

            # --- A CORREÇÃO INTELIGENTE ---
            if os.path.exists(self.db_path):
                sys.stderr.write(f"[CORE_LOGIC] Limpando banco de dados antigo em {self.db_path}\n")
                if os.path.isdir(self.db_path):
                    shutil.rmtree(self.db_path)  # Se for um diretório
                else:
                    os.remove(self.db_path)      # Se for um arquivo
            # --------------------------------

            vector_store = Qdrant.from_documents(
                all_docs, self.embeddings,
                path=self.db_path, collection_name="manus_biblioteca_vetorial"
            )
            retriever = vector_store.as_retriever(search_kwargs={'k': 5})

            def semantic_search_func(query: str) -> str:
                docs = retriever.invoke(query)
                if not docs: return "Nenhum documento relevante encontrado."
                return "\n\n---\n\n".join([f"Fonte: {d.metadata.get('source', 'N/A')}, Pagina: {d.metadata.get('page', -1) + 1}\nConteudo: {d.page_content}" for d in docs])

            tools = [Tool(name="busca_semantica_documentos", func=semantic_search_func, description="Use para buscar significado ou contexto nos documentos.")]
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", "Você é Manus, um assistente de pesquisa. Sua missão é ser útil, usando EXCLUSIVAMENTE os documentos fornecidos. Se a pergunta não for sobre os documentos (ex: 'olá'), responda de forma breve e educada sem usar ferramentas. Para perguntas sobre o conteúdo, use a ferramenta `busca_semantica_documentos`. Se a ferramenta não retornar nada relevante, sua única resposta permitida é: 'Após uma busca nos documentos, não encontrei uma resposta direta.' Nunca use conhecimento geral. Ao final da resposta, liste as fontes usadas."),
                MessagesPlaceholder(variable_name="chat_history"),
                ("user", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ])

            llm = ChatOpenAI(model_name="gpt-4o", openai_api_key=api_key, temperature=0)
            agent = create_openai_tools_agent(llm, tools, prompt)
            memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
            self.agent_executor = AgentExecutor(agent=agent, tools=tools, memory=memory, verbose=True, handle_parsing_errors=True, max_iterations=5)
            
            log_message("Documentos processados e agente inicializado com sucesso!")
            return {"success": True, "message": f"[OK] {len(pdf_files)} documento(s) processado(s) e biblioteca criada!"}

        except Exception as e:
            # --- O Ponto de Falha Seguro ---
            error_message = f"Falha ao inicializar o agente: {e}"
            sys.stderr.write(f"[CORE_LOGIC_ERROR] {error_message}\n{traceback.format_exc()}\n")
            return {"success": False, "message": str(e)}

    def ask_question(self, question: str) -> dict:
        if not self.is_initialized():
            log_message("ERRO: Tentativa de pergunta com agente nao inicializado.")
            return {"error": "O agente nao esta pronto. Por favor, carregue os documentos primeiro."}
        try:
            response = self.agent_executor.invoke({"input": question})
            return {"answer": response.get("output", "").strip()}
        except Exception as e:
            sys.stderr.write(f"[CORE_LOGIC_ERROR] Erro ao invocar o agente: {e}\n{traceback.format_exc()}\n")
            if "authentication" in str(e).lower():
                return {"error": "Chave da API da OpenAI inválida ou expirada."}
            return {"error": "Ocorreu um erro ao processar sua pergunta."}

setup_logging()
