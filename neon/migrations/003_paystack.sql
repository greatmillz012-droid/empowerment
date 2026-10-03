alter table public.users add column if not exists paystack_customer_code text unique;

-- Flutterwave account details cannot be reused for Paystack dedicated accounts.
update public.users
set virtual_account_number = null,
    virtual_account_bank = null,
    virtual_account_name = null
where payment_status = 'unpaid';

alter table public.users drop column if exists flutterwave_tx_ref;