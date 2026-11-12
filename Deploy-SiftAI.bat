@echo off
title Sift AI - Deploy to Vercel (push to main)
cd /d "%~dp0"
set LOG=deploy-result.log

rem Use GitKraken's bundled git (same as before); fall back to git on PATH
set "GIT_EXE=C:\Users\ThisPC\AppData\Local\gitkraken\app-12.6.1\resources\app.asar.unpacked\git\cmd\git.exe"
if not exist "%GIT_EXE%" set "GIT_EXE=git"

echo ==========================================================
echo    Sift AI - Deploy to Vercel (push current branch to main)
echo    Folder: %CD%
echo    Output is saved to %LOG%
echo ==========================================================
echo.

> %LOG% echo ===== FOLDER =====
>> %LOG% echo %CD%
>> %LOG% echo ===== BRANCH =====
"%GIT_EXE%" rev-parse --abbrev-ref HEAD >> %LOG% 2>&1
for /f %%b in ('"%GIT_EXE%" rev-parse --abbrev-ref HEAD') do set BRANCH=%%b

>> %LOG% echo ===== STATUS BEFORE =====
"%GIT_EXE%" status --short >> %LOG% 2>&1

rem 1) Commit any remaining changes to tracked files + the security scripts
"%GIT_EXE%" add -u >> %LOG% 2>&1
"%GIT_EXE%" add -- "src/app/api/health/security/route.ts" "scripts/security_lockdown_rls.sql" "build-check.bat" "Deploy-SiftAI.bat" >> %LOG% 2>&1
"%GIT_EXE%" diff --cached --quiet
if errorlevel 1 (
  >> %LOG% echo ===== COMMIT =====
  "%GIT_EXE%" commit -m "Security hardening: auth, tenant isolation, remove browser DB access" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01ULFT9t4Q6LR8rohoNimQ4b" >> %LOG% 2>&1
) else (
  >> %LOG% echo ===== COMMIT ===== nothing new to commit
)

rem 2) Make sure main on GitHub has nothing we don't have (never force-push)
>> %LOG% echo ===== FETCH =====
"%GIT_EXE%" fetch origin >> %LOG% 2>&1
"%GIT_EXE%" merge-base --is-ancestor origin/main HEAD
if errorlevel 1 (
  >> %LOG% echo STOPPED: origin/main has commits that are not in %BRANCH%. Merge main first.
  echo STOPPED: GitHub main has changes your branch doesn't have. Nothing was pushed.
  echo Tell Claude to read %LOG%
  pause
  exit /b 1
)

rem 3) Backup the working branch to GitHub, then deploy by updating main
>> %LOG% echo ===== PUSH BRANCH %BRANCH% =====
"%GIT_EXE%" push -u origin %BRANCH% >> %LOG% 2>&1

>> %LOG% echo ===== PUSH TO MAIN (Vercel production) =====
"%GIT_EXE%" push origin HEAD:main >> %LOG% 2>&1
set PUSH_EXIT=%ERRORLEVEL%
>> %LOG% echo PUSH_EXIT_CODE=%PUSH_EXIT%

>> %LOG% echo ===== DEPLOYED COMMIT =====
"%GIT_EXE%" log -1 --oneline >> %LOG% 2>&1

if "%PUSH_EXIT%"=="0" (
  echo DEPLOY PUSHED - Vercel will build production in a few minutes
) else (
  echo PUSH FAILED - exit code %PUSH_EXIT%
)
echo Tell Claude to read %LOG%
pause
