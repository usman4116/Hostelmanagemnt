alter table public.notices
  add column if not exists show_as_popup boolean not null default false;

comment on column public.notices.show_as_popup is
  'When true, an eligible published notice may be presented prominently in the resident portal.';

create index if not exists notices_active_popup_idx
  on public.notices (status, publish_date desc)
  where show_as_popup = true;
