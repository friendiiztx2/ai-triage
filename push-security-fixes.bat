@echo off
title Sift AI Back Office - Push security fixes
cd /d "%~dp0"
set LOG=deploy-result.log

echo ==========================================================
echo    Push security fixes to GitHub (branch: zoon-dev)
echo    Output is saved to %LOG%
echo ==========================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo git was not found on this computer's PATH.> %LOG%
  echo ERROR: git not found. Use GitKraken instead.
  pause
  exit /b 1
)

> %LOG% echo ===== BRANCH =====
git rev-parse --abbrev-ref HEAD >> %LOG% 2>&1
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
if /i not "%BRANCH%"=="zoon-dev" (
  >> %LOG% echo STOPPED: current branch is %BRANCH%, expected zoon-dev
  echo STOPPED: you are on branch "%BRANCH%", not "zoon-dev". Nothing was pushed.
  pause
  exit /b 1
)

>> %LOG% echo ===== STATUS BEFORE =====
git status --short >> %LOG% 2>&1

>> %LOG% echo ===== ADD (only the security-fix files) =====
git add -- ^
 "src/proxy.ts" ^
 "src/lib/auth.ts" ^
 "src/lib/jwt.ts" ^
 "src/lib/supabase.ts" ^
 "src/lib/chatFeedback.ts" ^
 "src/app/api/schema/route.ts" ^
 "src/app/api/users/route.ts" ^
 "src/app/api/users/[id]/route.ts" ^
 "src/app/api/users/login/route.ts" ^
 "src/app/api/users/profile/route.ts" ^
 "src/app/api/companies/route.ts" ^
 "src/app/api/chats/route.ts" ^
 "src/app/api/chats/issues/route.ts" ^
 "src/app/api/chats/feedback/route.ts" ^
 "src/app/api/chats/report/route.ts" ^
 "src/app/api/categories/route.ts" ^
 "src/app/api/customers/route.ts" ^
 "src/app/api/audit-logs/route.ts" ^
 "src/app/api/usage-quotas/route.ts" ^
 "src/app/api/summary/route.ts" ^
 "src/app/api/stats/categories/route.ts" ^
 "src/app/api/telegram-groups/route.ts" ^
 "src/app/api/telegram-groups/[id]/members/route.ts" ^
 "src/app/api/health/security/route.ts" ^
 "src/components/users/UserTableRow.tsx" ^
 "src/components/profile/EditProfileModal.tsx" ^
 "src/hooks/useChatsData.ts" ^
 "src/hooks/useChatTriage.ts" ^
 "src/hooks/useUrgentNotifier.ts" ^
 "src/hooks/useDashboardData.ts" ^
 ".env.example" ^
 ".gitignore" ^
 "build-check.bat" ^
 "push-security-fixes.bat" ^
 "scripts/security_lockdown_rls.sql" >> %LOG% 2>&1

>> %LOG% echo ===== STAGED FILES =====
git diff --cached --name-only >> %LOG% 2>&1

>> %LOG% echo ===== COMMIT =====
git commit ^
 -m "Security hardening: auth, tenant isolation, remove browser DB access" ^
 -m "- Remove forgeable user_session cookie auth fallback; sign tokens only with SESSION_SECRET" ^
 -m "- Lock down /api/schema, strip passwords and client_secret from API responses" ^
 -m "- Enforce company isolation and role hierarchy across API routes; exact-match login with rate limit" ^
 -m "- Replace browser Supabase realtime with authenticated API polling; server-only Supabase client" ^
 -m "- Add /api/health/security and scripts/security_lockdown_rls.sql" ^
 -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" ^
 -m "Claude-Session: https://claude.ai/code/session_01ULFT9t4Q6LR8rohoNimQ4b" >> %LOG% 2>&1

>> %LOG% echo ===== PUSH =====
git push origin zoon-dev >> %LOG% 2>&1
set PUSH_EXIT=%ERRORLEVEL%
>> %LOG% echo PUSH_EXIT_CODE=%PUSH_EXIT%

>> %LOG% echo ===== LAST COMMIT =====
git log -1 --oneline >> %LOG% 2>&1

if "%PUSH_EXIT%"=="0" (
  echo PUSH SUCCEEDED
) else (
  echo PUSH FAILED - exit code %PUSH_EXIT%
)
echo Done. Tell Claude to read %LOG%
pause
