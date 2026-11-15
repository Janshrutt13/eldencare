begin;
-- Service role is used only by the protected reminder worker and local seed CLI.
-- RLS bypass does not replace SQL privileges; make required grants explicit.
grant select,update on public.notifications to service_role;
grant select,insert,update on public.social_profiles to service_role;
grant select,update on public.profiles to service_role;
grant select on public.elder_profiles to service_role;
commit;
