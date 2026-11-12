-- =============================================================================
-- Sift AI — Supabase RLS lockdown (remove "allow everyone" policies)
-- =============================================================================
-- WHY: Most tables have policies like "Allow all for anon and auth" (ALL, USING true).
--      Anyone holding the anon key (which was shipped in the browser bundle) can read,
--      modify and delete every row — bypassing all checks in the BO API.
--
-- HOW IT WORKS: The service_role key BYPASSES RLS. Once these policies are removed,
--      only server code using the service_role / secret key can access the tables.
--      With RLS enabled and no policy for anon, anon gets nothing.
--
-- !!! BEFORE RUNNING ANY PHASE !!!
--   1. Deploy the BO version that contains /api/health/security, log in as system_admin
--      and open /api/health/security. "supabase_key_ok_for_strict_rls" MUST be true.
--      If it is false, set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY on Vercel and redeploy.
--   2. Check every OTHER system that uses this database (AI triage service, Telegram bot,
--      n8n, scripts...). Any of them using the anon key will stop working for the tables
--      you lock. Switch them to the service_role key first.
--      Tip: Supabase Dashboard → Logs → API, filter role = anon, to see who still uses anon.
--   3. Run ONE phase at a time, then test the BO and the bot before the next phase.
--      Each phase has a ROLLBACK block (commented out) to restore access if something breaks.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PHASE A — users (most sensitive: password hashes, roles). BO-only table.
-- -----------------------------------------------------------------------------
drop policy if exists "Allow all for anon and auth" on public.users;

-- ROLLBACK A:
-- create policy "Allow all for anon and auth" on public.users
--   for all to anon, authenticated using (true) with check (true);


-- -----------------------------------------------------------------------------
-- PHASE B — companies (client_secret) + BO admin tables.
-- ⚠ If the AI service verifies client_id/client_secret by reading `companies`
--   with the anon key, switch it to service_role BEFORE this phase.
-- -----------------------------------------------------------------------------
drop policy if exists "Allow all for anon and auth" on public.companies;
drop policy if exists "Allow Update Companies"      on public.companies;
drop policy if exists "Allow Select Companies"      on public.companies;
drop policy if exists "Allow Insert Companies"      on public.companies;
drop policy if exists "Allow all for anon and auth" on public.activity_logs;
drop policy if exists "Allow all for anon and auth" on public.system_ip_whitelist;
drop policy if exists "Allow all for anon and auth" on public.categories;

-- ROLLBACK B:
-- create policy "Allow all for anon and auth" on public.companies           for all to anon, authenticated using (true) with check (true);
-- create policy "Allow all for anon and auth" on public.activity_logs       for all to anon, authenticated using (true) with check (true);
-- create policy "Allow all for anon and auth" on public.system_ip_whitelist for all to anon, authenticated using (true) with check (true);
-- create policy "Allow all for anon and auth" on public.categories          for all to anon, authenticated using (true) with check (true);


-- -----------------------------------------------------------------------------
-- PHASE C — customer chat data (the AI pipeline most likely WRITES these).
-- ⚠ Switch the AI triage service to service_role first.
-- The "Users can only see chats of their own company" policy on chats is kept
-- (it only matches Supabase-auth JWTs and grants anon nothing).
-- -----------------------------------------------------------------------------
drop policy if exists "Allow all for anon and auth" on public.chats;
drop policy if exists "Allow all for anon and auth" on public.chat_issues;
drop policy if exists "Allow all for anon and auth" on public.customers;

-- ROLLBACK C:
-- create policy "Allow all for anon and auth" on public.chats       for all to anon, authenticated using (true) with check (true);
-- create policy "Allow all for anon and auth" on public.chat_issues for all to anon, authenticated using (true) with check (true);
-- create policy "Allow all for anon and auth" on public.customers   for all to anon, authenticated using (true) with check (true);


-- -----------------------------------------------------------------------------
-- PHASE D — AI / bot tables (prompts, knowledge, training, Telegram).
-- ⚠ Switch the AI service and Telegram bot to service_role first.
-- -----------------------------------------------------------------------------
drop policy if exists "Allow all for anon and auth"                       on public.prompt_configs;
drop policy if exists "Allow all for anon and auth"                       on public.knowledge_base;
drop policy if exists "Allow all for anon and auth"                       on public.training_examples;
drop policy if exists "Allow public access on training_examples"          on public.training_examples;
drop policy if exists "Allow all for anon and auth"                       on public.benchmark_results;
drop policy if exists "Allow public access on benchmark_results"          on public.benchmark_results;
drop policy if exists "Allow all for anon and auth"                       on public.audit_results;
drop policy if exists "Allow all for anon and auth"                       on public.audit_tasks;
drop policy if exists "Allow all for anon and auth"                       on public.telegram_chat_logs;
drop policy if exists "Allow public select and insert on telegram_chat_logs" on public.telegram_chat_logs;
drop policy if exists "Full access to telegram_group_members"             on public.telegram_group_members;
drop policy if exists "Full access to telegram_groups"                    on public.telegram_groups;

-- ROLLBACK D: recreate the specific policy that broke, e.g.
-- create policy "Allow all for anon and auth" on public.telegram_chat_logs for all to anon, authenticated using (true) with check (true);


-- -----------------------------------------------------------------------------
-- VERIFY — after all phases, this should only list the chats company policy.
-- -----------------------------------------------------------------------------
-- select tablename, policyname, roles, cmd, qual
-- from pg_policies where schemaname = 'public' order by tablename;
