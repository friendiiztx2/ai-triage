@echo off
title Sift AI Back Office - Build Check
cd /d "%~dp0"
set PATH=C:\Users\ThisPC\nodejs\PFiles64\nodejs;%PATH%

echo ==========================================================
echo    Sift AI Back Office - npm run build
echo    Output is saved to build-result.log
echo ==========================================================
echo.

call npm run build > build-result.log 2>&1
set BUILD_EXIT=%ERRORLEVEL%
echo.>> build-result.log
>> build-result.log echo BUILD_EXIT_CODE=%BUILD_EXIT%

if "%BUILD_EXIT%"=="0" (
  echo BUILD PASSED
) else (
  echo BUILD FAILED - exit code %BUILD_EXIT%
)
echo Done. Tell Claude to read build-result.log
pause
