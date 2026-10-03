alter table public.users drop column if exists paystack_customer_code;
alter table public.users add column if not exists flutterwave_tx_ref text unique;

-- Previously issued Paystack account numbers cannot be used as Flutterwave accounts.
update public.users
set virtual_account_number = null,
    virtual_account_bank = null,
    virtual_account_name = null,
    flutterwave_tx_ref = null
where payment_status = 'unpaid';
