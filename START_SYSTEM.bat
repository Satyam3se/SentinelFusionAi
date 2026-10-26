@echo off
title SentinelFusion AI - Defence Situational Awareness Launcher
color 0A
cls
echo =====================================================================
echo       SENTINELFUSION AI - DEFENCE EVALUATION PLATFORM LAUNCHER
echo                 Dark Tricolour Edition (Air-Gapped)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting SentinelFusion Python FastAPI Backend (Port 8000)...
start "SentinelFusion AI - Backend" cmd /k "cd /d "%~dp0backend" && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 >nul

echo [2/3] Starting SentinelFusion React Frontend (Port 5173)...
start "SentinelFusion AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 >nul

echo [3/3] Opening Mission Console in Default Browser...
start http://127.0.0.1:5173/dashboard

echo.
echo =====================================================================
echo  System is RUNNING!
echo  Frontend URL: http://127.0.0.1:5173/
echo  Backend URL:  http://127.0.0.1:8000/
echo  Demo Credentials:
echo    Username: admin     Password: SentinelAdminDemo#2026
echo =====================================================================
echo.
pause
