create index if not exists product_profiles_updated_by_idx on public.organization_product_profiles(updated_by);
create index if not exists product_events_user_idx on public.product_events(user_id);
