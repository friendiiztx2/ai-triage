@echo off
subst V: A:\ >nul 2>&1
cd /d "A:\Ai Triage-20260922T075841Z-1-001"
set "GIT_EXE=C:\Users\ThisPC\AppData\Local\gitkraken\app-12.6.1\resources\app.asar.unpacked\git\cmd\git.exe"
echo Starting deploy...
"%GIT_EXE%" add -A > "A:\Ai Triage-20260922T075841Z-1-001\deploy-result.log" 2>&1
"%GIT_EXE%" commit -m "feat(companies): add 4-step Company Onboarding Wizard and Customer Handover Kit" >> "A:\Ai Triage-20260922T075841Z-1-001\deploy-result.log" 2>&1
"%GIT_EXE%" push origin main >> "A:\Ai Triage-20260922T075841Z-1-001\deploy-result.log" 2>&1
echo DONE >> "A:\Ai Triage-20260922T075841Z-1-001\deploy-result.log"
echo Deploy completed!
timeout /t 3
