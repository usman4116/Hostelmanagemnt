alter table public.maintenance_requests
  add column if not exists admission_id uuid
    references public.admissions(id) on delete restrict,
  add column if not exists bed_id uuid
    references public.beds(id) on delete restrict;

create index if not exists maintenance_requests_admission_id_idx
  on public.maintenance_requests(admission_id);

create index if not exists maintenance_requests_bed_id_idx
  on public.maintenance_requests(bed_id);

comment on column public.maintenance_requests.admission_id is
  'Optional immutable admission relationship captured for maintenance history.';

comment on column public.maintenance_requests.bed_id is
  'Optional immutable bed relationship captured for maintenance history.';
