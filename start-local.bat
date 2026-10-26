@echo off
title Sift AI Back Office - Local Server
cd /d "%~dp0"
set PATH=C:\Users\ThisPC\nodejs\PFiles64\nodejs;%PATH%

echo ==========================================================
echo    Starting Sift AI Back Office (Local Development)
echo    Link: http://localhost:3000
echo    Chats: http://localhost:3000/chats
echo ==========================================================
echo.

start "" "http://localhost:3000"
npm run dev
pause
