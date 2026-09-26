create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text not null,
  gender text not null,
  state text not null,
  email_verified boolean not null default false,
  empowerment_type text,
  paystack_customer_code text unique,
  virtual_account_number text unique,
  virtual_account_bank text,
  virtual_account_name text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  payment_reference text unique,
  payment_confirmation_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  otp_code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  created_at timestamptz not null default now()
);

create index if not exists otps_user_created_idx on public.otps(user_id, created_at desc);
create index if not exists users_payment_status_idx on public.users(payment_status);

alter table public.users enable row level security;
alter table public.otps enable row level security;

revoke all on public.users, public.otps from anon, authenticated;
grant all on public.users, public.otps to service_role;

create or replace function public.consume_registration_otp(p_user_id uuid, p_otp_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  verified_user_id uuid;
  otp_row record;
begin
  select id, user_id, otp_code, attempt_count
  into otp_row
  from public.otps
  where user_id = p_user_id and used = false and expires_at > now()
  order by created_at desc
  limit 1
  for update skip locked;

  if not found then return null; end if;
  if otp_row.attempt_count >= 5 then
    update public.otps set used = true where id = otp_row.id;
    return null;
  end if;
  if otp_row.otp_code <> p_otp_hash then
    update public.otps
    set attempt_count = attempt_count + 1, used = (attempt_count + 1 >= 5)
    where id = otp_row.id;
    return null;
  end if;

  update public.otps set used = true where id = otp_row.id returning user_id into verified_user_id;

  if verified_user_id is not null then
    update public.users set email_verified = true where id = verified_user_id;
  end if;
  return verified_user_id;
end;
$$;

revoke all on function public.consume_registration_otp(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_registration_otp(uuid, text) to service_role;
