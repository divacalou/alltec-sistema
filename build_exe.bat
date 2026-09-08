@echo off
REM Gera o executavel PlannaGestao.exe (Windows) usando PyInstaller.
REM Execute este arquivo dentro da pasta planna_sistema.

echo Instalando dependencias (se necessario)...
pip install pyinstaller pillow

echo Gerando executavel...
pyinstaller --onefile --windowed --name PlannaGestao --add-data "assets;assets" main.py

echo.
echo Concluido! O executavel esta em: dist\PlannaGestao.exe
echo Copie PlannaGestao.exe para a pasta onde o sistema vai rodar.
pause
