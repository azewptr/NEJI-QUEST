@echo off
cd /d "%~dp0"
set "NEJI_PYTHON=python"
if exist .runtime\Scripts\python.exe set "NEJI_PYTHON=.runtime\Scripts\python.exe"
if exist .venv\Scripts\python.exe set "NEJI_PYTHON=.venv\Scripts\python.exe"
echo Buka http://127.0.0.1:8000 setelah server siap.
"%NEJI_PYTHON%" -m uvicorn backend_ai.app:app --host 127.0.0.1 --port 8000
pause
