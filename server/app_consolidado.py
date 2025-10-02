import sys
import traceback
import os
import json
import tkinter as tk
from tkinter import filedialog
import shutil
import time

from core_logic import AgentManager, check_openai_api_key

# --- Funções Auxiliares de Comunicação ---

def log_message(message):
    sys.stderr.write(f"[PYTHON_LOG] {message}\n")
    sys.stderr.flush()

def send_response(data):
    response_json = json.dumps(data)
    sys.stdout.write(response_json + '\n')
    sys.stdout.flush()

# --- Funções de Ação ---

agent_manager = None

def verificar_estado_inicial(payload):
    try:
        log_message("Verificando estado inicial...")
        global agent_manager
        if agent_manager and agent_manager.is_initialized():
            send_response({"status": "success", "action": "verificar_estado_inicial", "result": {"status": "READY"}})
        else:
            send_response({"status": "success", "action": "verificar_estado_inicial", "result": {"status": "NOT_READY"}})
    except Exception as e:
        send_response({"status": "error", "message": f"Erro em verificar_estado_inicial: {e}\n{traceback.format_exc()}"})

# A CORREÇÃO ESTÁ AQUI: Ação única para salvar e validar
def salvar_e_validar_chave(payload):
    try:
        api_key = payload.get('data', '').strip()
        log_message("Salvando e validando a chave da API...")

        # 1. Salva a chave no arquivo .env
        config_dir = os.path.join(os.path.expanduser("~"), ".IntelligentLibrary")
        os.makedirs(config_dir, exist_ok=True)
        env_path = os.path.join(config_dir, ".env")
        with open(env_path, "w") as f:
            f.write(f'OPENAI_API_KEY="{api_key}"\n')
        log_message("API key salva no arquivo .env.")

        # 2. Valida a chave com a OpenAI
        is_valid, message = check_openai_api_key(api_key)
        if is_valid:
            log_message("Chave da API é válida.")
        else:
            log_message(f"Chave da API inválida: {message}")
        
        send_response({"status": "success", "action": "salvar_e_validar_chave", "result": {"success": is_valid, "message": message}})

    except Exception as e:
        send_response({"status": "error", "message": f"Erro durante o salvamento e validação da chave: {e}"})


def select_pdf_files(payload):
    try:
        log_message("Abrindo dialogo de selecao de arquivos...")
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        file_paths = filedialog.askopenfilenames(
            title="Selecione um ou mais arquivos PDF",
            filetypes=[("Arquivos PDF", "*.pdf")]
        )
        root.destroy()
        if file_paths:
            log_message(f"{len(file_paths)} arquivos selecionados.")
        else:
            log_message("Nenhum arquivo selecionado.")
        send_response({"status": "success", "action": "select_pdf_files", "result": list(file_paths)})
    except Exception as e:
        send_response({"status": "error", "message": f"Erro ao abrir dialogo: {e}"})

def carregar_documentos(payload):
    global agent_manager
    try:
        data = payload.get('data', {})
        file_paths = data.get('filePaths', [])
        api_key = data.get('apiKey', '').strip()

        if not file_paths:
            return send_response({"status": "success", "action": "carregar_documentos", "result": {"success": False, "message": "Nenhum caminho de arquivo foi fornecido."}})

        log_message(f"Carregando {len(file_paths)} documentos...")
        
        docs_dir = os.path.join(os.path.dirname(__file__), "documents")
        os.makedirs(docs_dir, exist_ok=True)
        
        for item in os.listdir(docs_dir):
            item_path = os.path.join(docs_dir, item)
            if os.path.isfile(item_path):
                os.unlink(item_path)

        copied_count = 0
        for src_path in file_paths:
            if os.path.exists(src_path):
                filename = os.path.basename(src_path)
                dest_path = os.path.join(docs_dir, filename)
                shutil.copy2(src_path, dest_path)
                copied_count += 1
        
        log_message(f"Copiados {copied_count} arquivos PDF.")
        time.sleep(1)

        agent_manager = AgentManager()
        success, message = agent_manager.initialize_agent(api_key)

        if success:
            log_message("Documentos processados e agente inicializado com sucesso!")
        else:
            log_message(f"Falha ao inicializar o agente: {message}")

        send_response({"status": "success", "action": "carregar_documentos", "result": {"success": success, "message": message}})

    except Exception as e:
        error_message = f"Erro ao carregar documentos: {e}\n{traceback.format_exc()}"
        log_message(error_message)
        send_response({"status": "error", "message": error_message})

def processar_pergunta(payload):
    if agent_manager and agent_manager.is_initialized():
        pergunta = payload.get('data', {}).get('pergunta')
        resposta = agent_manager.ask_question(pergunta)
        send_response({"status": "success", "action": "processar_pergunta", "result": resposta})
    else:
        send_response({"status": "success", "action": "processar_pergunta", "result": {"error": "O agente não está pronto. Por favor, carregue os documentos primeiro."}})

# --- Mapeamento de Ações e Loop Principal ---

ACTION_MAP = {
    "verificar_estado_inicial": verificar_estado_inicial,
    "salvar_e_validar_chave": salvar_e_validar_chave, # AÇÃO ÚNICA
    "select_pdf_files": select_pdf_files,
    "carregar_documentos": carregar_documentos,
    "processar_pergunta": processar_pergunta,
}

def main():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            action = request.get("action")
            
            if action in ACTION_MAP:
                ACTION_MAP[action](request)
            else:
                send_response({"status": "error", "message": f"Acao desconhecida: {action}"})
        except json.JSONDecodeError:
            send_response({"status": "error", "message": f"Erro ao decodificar JSON: {line.strip()}"})
        except Exception as e:
            send_response({"status": "error", "message": f"Erro inesperado no loop principal: {e}\n{traceback.format_exc()}"})

if __name__ == '__main__':
    main()
