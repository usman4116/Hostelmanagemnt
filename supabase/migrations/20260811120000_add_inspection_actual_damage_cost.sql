alter table public.room_inspections
  add column if not exists actual_damage_cost numeric(12, 2) not null default 0;

alter table public.room_inspections
  drop constraint if exists room_inspections_actual_damage_cost_nonnegative;

alter table public.room_inspections
  add constraint room_inspections_actual_damage_cost_nonnegative
  check (actual_damage_cost >= 0);

comment on column public.room_inspections.actual_damage_cost is
  'Final damage amount recorded after inspection review; inspection history is preserved.';
