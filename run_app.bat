@echo off
REM Script para iniciar a aplicação com atualização de dependências
REM Abre automaticamente no navegador na porta 5004

echo ============================================================
echo Gerador de Evidências de Teste - Inicializador
echo ============================================================
echo.

REM Executa o script Python
python run_app.py

REM Se houver erro, mantém a janela aberta
if errorlevel 1 (
    echo.
    echo Erro ao executar a aplicacao. Pressione qualquer tecla...
    pause
)
