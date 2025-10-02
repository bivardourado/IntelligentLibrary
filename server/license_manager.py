import os
import json
import hashlib
from datetime import datetime, timedelta

# Configurações do sistema de licença
LICENSE_FILE = os.path.join(os.path.expanduser("~"), ".IntelligentLibrary", "license.json")
TRIAL_DAYS = 7
LICENSE_DURATION_DAYS = 365

class LicenseManager:
    """
    Gerenciador de licenças offline simples para o MVP.
    Funciona com data de instalação + validação de chaves.
    """
    
    @staticmethod
    def _get_machine_id():
        """
        Gera um ID único da máquina baseado em características do sistema.
        Usado para vincular licenças a máquinas específicas (anti-pirataria básica).
        """
        import platform
        machine_info = f"{platform.machine()}-{platform.processor()}-{platform.system()}"
        return hashlib.md5(machine_info.encode()).hexdigest()[:16]
    
    @staticmethod
    def _generate_license_key(machine_id, duration_days=LICENSE_DURATION_DAYS):
        """
        Gera uma chave de licença simples (para demonstração).
        Em produção, isso seria feito no servidor de vendas.
        """
        import secrets
        random_part = secrets.token_hex(8)
        return f"IL-{machine_id[:8]}-{duration_days}-{random_part}".upper()
    
    @staticmethod
    def _validate_license_key(license_key, machine_id):
        """
        Valida se uma chave de licença é válida para esta máquina.
        """
        try:
            parts = license_key.strip().upper().split('-')
            if len(parts) != 4 or parts[0] != 'IL':
                return False
            
            key_machine_id = parts[1]
            duration = int(parts[2])
            
            # Verifica se a chave pertence a esta máquina
            if key_machine_id != machine_id[:8].upper():
                return False
            
            # Verifica se a duração é válida
            if duration not in [7, 30, 365]:  # Trial, mensal, anual
                return False
                
            return True
            
        except (ValueError, IndexError):
            return False
    
    @staticmethod
    def _get_license_info():
        """
        Lê informações da licença do arquivo local.
        """
        try:
            if os.path.exists(LICENSE_FILE):
                with open(LICENSE_FILE, 'r') as f:
                    return json.load(f)
            return None
        except (json.JSONDecodeError, IOError):
            return None
    
    @staticmethod
    def _save_license_info(license_data):
        """
        Salva informações da licença no arquivo local.
        """
        try:
            os.makedirs(os.path.dirname(LICENSE_FILE), exist_ok=True)
            with open(LICENSE_FILE, 'w') as f:
                json.dump(license_data, f, indent=2)
            return True
        except IOError:
            return False

def check_license_status():
    """
    Função principal que verifica o status atual da licença.
    Retorna um dicionário com o status e informações relevantes.
    """
    machine_id = LicenseManager._get_machine_id()
    license_info = LicenseManager._get_license_info()
    
    # Primeira execução - inicializa trial
    if license_info is None:
        print("🆕 Primeira execução detectada - iniciando período de trial")
        
        trial_start = datetime.now().isoformat()
        trial_end = (datetime.now() + timedelta(days=TRIAL_DAYS)).isoformat()
        
        license_info = {
            "machine_id": machine_id,
            "type": "TRIAL",
            "trial_start": trial_start,
            "trial_end": trial_end,
            "activated_at": None,
            "license_key": None
        }
        
        LicenseManager._save_license_info(license_info)
    
    # Verifica se é trial
    if license_info.get("type") == "TRIAL":
        trial_end = datetime.fromisoformat(license_info["trial_end"])
        days_left = (trial_end - datetime.now()).days
        
        if days_left <= 0:
            return {
                "status": "TRIAL_EXPIRED",
                "message": f"⏰ Seu período de teste de {TRIAL_DAYS} dias expirou. Ative uma licença para continuar.",
                "days_left": 0,
                "type": "TRIAL"
            }
        else:
            return {
                "status": "TRIAL_ACTIVE",
                "message": f"🆓 Período de teste ativo. {days_left} dias restantes.",
                "days_left": days_left,
                "type": "TRIAL"
            }
    
    # Verifica se é licença paga
    elif license_info.get("type") == "LICENSED":
        activated_at = datetime.fromisoformat(license_info["activated_at"])
        expires_at = activated_at + timedelta(days=LICENSE_DURATION_DAYS)
        days_left = (expires_at - datetime.now()).days
        
        if days_left <= 0:
            return {
                "status": "LICENSE_EXPIRED",
                "message": f"⏰ Sua licença anual expirou. Renove para continuar usando o aplicativo.",
                "days_left": 0,
                "type": "LICENSED"
            }
        else:
            return {
                "status": "LICENSE_ACTIVE",
                "message": f"✅ Licença ativa. {days_left} dias restantes.",
                "days_left": days_left,
                "type": "LICENSED"
            }
    
    # Estado inválido
    else:
        return {
            "status": "INVALID",
            "message": "❌ Estado da licença inválido. Reinstale o aplicativo.",
            "days_left": 0,
            "type": "INVALID"
        }

def activate_license(license_key):
    """
    Ativa uma licença com a chave fornecida.
    """
    machine_id = LicenseManager._get_machine_id()
    
    # Valida a chave
    if not LicenseManager._validate_license_key(license_key, machine_id):
        return {
            "success": False,
            "message": "❌ Chave de licença inválida ou não compatível com este computador."
        }
    
    # Ativa a licença
    license_info = {
        "machine_id": machine_id,
        "type": "LICENSED",
        "license_key": license_key,
        "activated_at": datetime.now().isoformat(),
        "trial_start": None,
        "trial_end": None
    }
    
    if LicenseManager._save_license_info(license_info):
        return {
            "success": True,
            "message": f"✅ Licença ativada com sucesso! Válida por {LICENSE_DURATION_DAYS} dias."
        }
    else:
        return {
            "success": False,
            "message": "❌ Erro ao salvar informações da licença. Verifique as permissões do sistema."
        }

def generate_demo_license():
    """
    Função utilitária para gerar uma chave de licença para testes.
    REMOVER EM PRODUÇÃO!
    """
    machine_id = LicenseManager._get_machine_id()
    demo_key = LicenseManager._generate_license_key(machine_id, 365)
    
    print("🔑 CHAVE DE DEMONSTRAÇÃO GERADA:")
    print(f"   Machine ID: {machine_id}")
    print(f"   License Key: {demo_key}")
    print("   ⚠️ Esta chave é apenas para testes!")
    
    return demo_key

# Teste do sistema de licenças
if __name__ == "__main__":
    print("🧪 Testando sistema de licenças...")
    
    status = check_license_status()
    print(f"Status atual: {status}")
    
    # Gera chave de demonstração
    demo_key = generate_demo_license()
    
    # Testa ativação
    print(f"\n🔄 Testando ativação com chave: {demo_key}")
    result = activate_license(demo_key)
    print(f"Resultado: {result}")
    
    # Verifica status após ativação
    new_status = check_license_status()
    print(f"Novo status: {new_status}")