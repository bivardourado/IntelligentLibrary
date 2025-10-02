#!/usr/bin/env python3
"""
Script simplificado para executar o Intelligent Library
Usage: python run.py
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path

def check_python_version():
    """Verifica se a versão do Python é compatível"""
    if sys.version_info < (3, 8):
        print("❌ Erro: Python 3.8+ é necessário")
        print(f"   Versão atual: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} OK")
    return True

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    requirements_file = Path("requirements_atualizado.txt")
    if not requirements_file.exists():
        print("❌ Arquivo requirements_atualizado.txt não encontrado")
        return False
    
    print("🔍 Verificando dependências Python...")
    try:
        # Tenta importar as principais dependências
        import eel
        import langchain
        import openai
        print("✅ Dependências principais OK")
        return True
    except ImportError as e:
        print(f"❌ Dependência faltando: {e}")
        print("📦 Instalando dependências...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements_atualizado.txt"], 
                         check=True, capture_output=True)
            print("✅ Dependências instaladas com sucesso")
            return True
        except subprocess.CalledProcessError:
            print("❌ Erro ao instalar dependências")
            return False

def run_backend():
    """Executa o backend Python"""
    print("🐍 Iniciando backend Python...")
    try:
        subprocess.run([sys.executable, "app_consolidado.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Backend interrompido pelo usuário")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro no backend: {e}")
    except FileNotFoundError:
        print("❌ Arquivo app_consolidado.py não encontrado")

def run_electron():
    """Executa o frontend Electron (se disponível)"""
    print("⚡ Tentando iniciar Electron...")
    
    # Verifica se o Node.js está disponível
    try:
        subprocess.run(["node", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js não encontrado. Apenas o backend será executado.")
        return False
    
    # Verifica se o Electron está instalado
    if not Path("node_modules").exists():
        print("📦 Instalando dependências Node.js...")
        try:
            subprocess.run(["npm", "install"], check=True)
        except subprocess.CalledProcessError:
            print("❌ Erro ao instalar dependências Node.js")
            return False
    
    # Executa o Electron
    try:
        subprocess.run(["npm", "start"], check=True)
        return True
    except subprocess.CalledProcessError:
        print("❌ Erro ao iniciar Electron")
        return False

def main():
    """Função principal"""
    print("🚀 Intelligent Library - Iniciador Automático")
    print("=" * 50)
    
    # Verificações básicas
    if not check_python_version():
        sys.exit(1)
    
    if not check_dependencies():
        sys.exit(1)
    
    # Verifica se os arquivos principais existem
    required_files = ["app_consolidado.py", "license_manager.py"]
    for file in required_files:
        if not Path(file).exists():
            print(f"❌ Arquivo {file} não encontrado")
            sys.exit(1)
    
    print("✅ Todos os arquivos necessários encontrados")
    print("\n🎯 Escolha o modo de execução:")
    print("1. Backend + Frontend (Electron) - Recomendado")
    print("2. Apenas Backend (Abrir http://localhost:8000 no navegador)")
    print("3. Sair")
    
    try:
        choice = input("\nDigite sua opção (1-3): ").strip()
        
        if choice == "1":
            print("\n🚀 Executando modo completo...")
            # Tenta executar com Electron
            if not run_electron():
                print("\n⚠️  Electron falhou, executando apenas backend...")
                run_backend()
        
        elif choice == "2":
            print("\n🚀 Executando apenas backend...")
            print("📖 Após iniciar, abra http://localhost:8000 no seu navegador")
            run_backend()
        
        elif choice == "3":
            print("👋 Até logo!")
            sys.exit(0)
        
        else:
            print("❌ Opção inválida")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n👋 Execução interrompida pelo usuário")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    main()