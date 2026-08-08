create or replace function private.bootstrap_organization_core(p_name text,p_display_name text)
returns table(organization_id uuid,organization_name text,organization_slug text,organization_plan text,organization_created_at timestamptz,member_id uuid,member_joined_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare caller_id uuid := auth.uid(); caller_email text := coalesce(auth.jwt()->>'email',''); new_org public.organizations; new_member public.organization_members; base_slug text;
begin
  if caller_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if char_length(trim(p_name)) not between 2 and 80 or char_length(trim(p_display_name)) not between 2 and 80 then raise exception 'invalid onboarding input' using errcode='22023'; end if;
  if exists(select 1 from public.organization_members where user_id=caller_id and status='active') then raise exception 'workspace already initialized' using errcode='P0001'; end if;
  base_slug:=trim(both '-' from regexp_replace(lower(trim(p_name)),'[^a-z0-9]+','-','g'));
  if base_slug='' then base_slug:='workspace'; end if;
  insert into public.organizations(name,slug,plan) values(trim(p_name),base_slug||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,8),'team') returning * into new_org;
  insert into public.organization_members(organization_id,user_id,display_name,email,role,status) values(new_org.id,caller_id,trim(p_display_name),caller_email,'owner','active') returning * into new_member;
  return query select new_org.id,new_org.name,new_org.slug,new_org.plan,new_org.created_at,new_member.id,new_member.joined_at;
end $$;

revoke all on function private.bootstrap_organization_core(text,text) from public,anon;
grant execute on function private.bootstrap_organization_core(text,text) to authenticated;

create or replace function public.bootstrap_organization(p_name text,p_display_name text)
returns table(organization_id uuid,organization_name text,organization_slug text,organization_plan text,organization_created_at timestamptz,member_id uuid,member_joined_at timestamptz)
language sql security invoker set search_path='' as $$
  select * from private.bootstrap_organization_core(p_name,p_display_name)
$$;

revoke all on function public.bootstrap_organization(text,text) from public,anon;
grant execute on function public.bootstrap_organization(text,text) to authenticated;
