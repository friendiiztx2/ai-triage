@echo off
title Sift AI - Restructure files + build check
cd /d "%~dp0"
set LOG=build-result.log

set "GIT_EXE=C:\Users\ThisPC\AppData\Local\gitkraken\app-12.6.1\resources\app.asar.unpacked\git\cmd\git.exe"
if not exist "%GIT_EXE%" set "GIT_EXE=git"
set PATH=C:\Users\ThisPC\nodejs\PFiles64\nodejs;%PATH%

echo ==========================================================
echo    Restructure files, then npm run build
echo    Output is saved to %LOG%
echo ==========================================================
echo.

> %LOG% echo ===== REMOVE OLD / DUPLICATE FILES =====
rem Moved files (new copies already exist in components\sidebar and components\sound)
if exist "src\components\sidebar\Sidebar.tsx" if exist "src\components\Sidebar.tsx" "%GIT_EXE%" rm -q --cached "src/components/Sidebar.tsx" >> %LOG% 2>&1
if exist "src\components\sidebar\Sidebar.tsx" if exist "src\components\Sidebar.tsx" del /q "src\components\Sidebar.tsx"
if exist "src\components\sound\SoundSettingsModal.tsx" if exist "src\components\SoundSettingsModal.tsx" "%GIT_EXE%" rm -q --cached "src/components/SoundSettingsModal.tsx" >> %LOG% 2>&1
if exist "src\components\sound\SoundSettingsModal.tsx" if exist "src\components\SoundSettingsModal.tsx" del /q "src\components\SoundSettingsModal.tsx"

rem Duplicate user manuals (identical copy stays in public\manual.html)
if exist "public\manual.html" (
  if exist "AI_Triage_User_Manual.html" "%GIT_EXE%" rm -q "AI_Triage_User_Manual.html" >> %LOG% 2>&1
  if exist "Sift_AI_User_Manual.html" "%GIT_EXE%" rm -q "Sift_AI_User_Manual.html" >> %LOG% 2>&1
)

rem Old helper script replaced by Deploy-SiftAI.bat
if exist "push-security-fixes.bat" "%GIT_EXE%" rm -q "push-security-fixes.bat" >> %LOG% 2>&1

>> %LOG% echo ===== STAGE NEW FILES =====
"%GIT_EXE%" add -- "src/components/sidebar/Sidebar.tsx" "src/components/sound/SoundSettingsModal.tsx" "README.md" "restructure-and-build.bat" >> %LOG% 2>&1
"%GIT_EXE%" status --short >> %LOG% 2>&1

>> %LOG% echo ===== BUILD =====
call npm run build >> %LOG% 2>&1
set BUILD_EXIT=%ERRORLEVEL%
>> %LOG% echo BUILD_EXIT_CODE=%BUILD_EXIT%

if "%BUILD_EXIT%"=="0" (
  echo BUILD PASSED
) else (
  echo BUILD FAILED - exit code %BUILD_EXIT%
)
echo Tell Claude to read %LOG%
pause
