@echo off
cd /d "%~dp0"
py -3.12 -m venv .venv
if errorlevel 1 py -3.11 -m venv .venv
if errorlevel 1 (
  echo Pasang Python 3.11 atau 3.12 dari python.org lalu ulangi.
  pause
  exit /b 1
)
.venv\Scripts\python.exe -m pip install -r backend_ai\requirements.txt
if errorlevel 1 (
  pause
  exit /b 1
)
call npm.cmd ci
if errorlevel 1 (
  pause
  exit /b 1
)
echo Instalasi selesai. Buka JALANKAN_WEB.bat untuk mencoba Unggah Kartu.
pause
