-- Run AFTER the migration in a disposable Supabase project, using SQL Editor.
-- Transaction rolls back all fictional fixtures. Any failed assertion aborts it.
begin;
do $$ begin
  if exists (select 1 from auth.users where id in (
    '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444'
  )) then raise exception 'Fixture IDs exist. Use a clean test project.'; end if;
end $$;
insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111', 'elder-one@example.test', '{"display_name":"Elder One Demo","role":"elderly"}'),
 ('22222222-2222-4222-8222-222222222222', 'elder-two@example.test', '{"display_name":"Elder Two Demo","role":"elderly"}'),
 ('33333333-3333-4333-8333-333333333333', 'family@example.test', '{"display_name":"Family Demo","role":"family"}'),
 ('44444444-4444-4444-8444-444444444444', 'caretaker@example.test', '{"display_name":"Caretaker Demo","role":"caretaker"}');
select set_config('test.elder_id', (select id::text from public.elder_profiles where owner_id='11111111-1111-4111-8111-111111111111'), true);
select set_config('test.other_elder_id', (select id::text from public.elder_profiles where owner_id='22222222-2222-4222-8222-222222222222'), true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$ begin
  if (select count(*) from public.elder_profiles) <> 1 then raise exception 'Owner isolation failed'; end if;
  if public.can_access_elder(current_setting('test.other_elder_id')::uuid) then raise exception 'Unauthorized access'; end if;
  begin
    update public.profiles set role='caretaker' where id=auth.uid();
    raise exception 'Role mutation was allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.create_care_invite(current_setting('test.other_elder_id')::uuid, 'family');
    raise exception 'Unauthorized invitation was allowed';
  exception when raise_exception then
    if sqlerrm <> 'Not authorized' then raise; end if;
  end;
end $$;
select set_config('test.invite', public.create_care_invite(current_setting('test.elder_id')::uuid, 'family'), true);
do $$ begin
  if exists (select 1 from public.care_invites where code_hash=current_setting('test.invite')) then raise exception 'Plaintext token stored'; end if;
end $$;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
do $$ begin
  begin
    perform public.redeem_care_invite(current_setting('test.invite'));
    raise exception 'Wrong role accepted';
  exception when raise_exception then
    if sqlerrm <> 'Invitation unavailable' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
do $$ begin
  if (select count(*) from public.elder_profiles) <> 0 then raise exception 'Uninvited user sees profiles'; end if;
  begin
    insert into public.care_memberships (elder_profile_id,member_id,role) values (current_setting('test.elder_id')::uuid,auth.uid(),'family');
    raise exception 'Direct membership insertion allowed';
  exception when insufficient_privilege then null; end;
end $$;
select public.redeem_care_invite(current_setting('test.invite'));
do $$ begin
  if (select count(*) from public.elder_profiles) <> 1 then raise exception 'Invited user access failed'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'Private account leak'; end if;
  if (select count(*) from public.care_invites) <> 0 then raise exception 'Invitation hash leak'; end if;
  begin
    perform public.redeem_care_invite(current_setting('test.invite'));
    raise exception 'Invitation reused';
  exception when raise_exception then
    if sqlerrm <> 'Invitation unavailable' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
delete from public.care_memberships where elder_profile_id=current_setting('test.elder_id')::uuid;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
do $$ begin
  if (select count(*) from public.elder_profiles) <> 0 then raise exception 'Revocation failed'; end if;
end $$;
reset role;
rollback;
