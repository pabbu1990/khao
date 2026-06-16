-- Run once in Supabase SQL Editor: add dishes + services to the realtime feed
-- so the customer storefront and vendor menu update live.
do $$ begin alter publication supabase_realtime add table public.dishes;   exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.services;  exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.vendors;   exception when others then null; end $$;
