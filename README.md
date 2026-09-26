# NextGen Youth Empowerment Registration

Next.js 14 App Router registration platform using Supabase, Resend, Paystack Dedicated Virtual Accounts, and Vercel-compatible route handlers. Participants register, verify email by a one-use six-digit code, choose an empowerment track, and pay the ₦2,000 form-purchase fee by bank transfer. Admins sign in with an authorized Supabase Auth account.

## Local setup

1. Install Node.js 20 or newer and npm.
2. Copy `.env.example` to `.env.local` and fill in the values described below.
3. Run `npm install` and `npm run dev`; open `http://localhost:3000`.
4. Run `npm run build` before deploying.

### Environment variables

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project Settings > API | Public project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project Settings > API | Publishable/anon key; never use the service-role key in the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project Settings > API | Server-only; bypasses RLS. Keep it out of `NEXT_PUBLIC_*` variables. |
| `RESEND_API_KEY` | Resend API keys | Server-only transactional email key. |
| `EMAIL_FROM` | Verified sender in Resend | For example `NextGen <updates@your-domain.example>`. Verify the sending domain first. |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard > Settings > API Keys & Webhooks | Use test secret keys until end-to-end testing is complete. |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack secret key | Paystack signs webhooks with the secret key; set this to the same secret key. |
| `PAYSTACK_PREFERRED_BANK` | Paystack Dedicated Virtual Account configuration | Optional. Use a bank name supported for your Paystack account. |
| `SESSION_SECRET` | Generate locally | At least 32 random characters; signs participant cookies. |
| `OTP_SECRET` | Generate locally | A different 32+ random characters; HMAC-hashes OTPs at rest. |
| `NEXT_PUBLIC_SITE_URL` | Your local/deployed origin | `http://localhost:3000` locally; deployed origin in Vercel. |

Generate secrets with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` (run it twice for independent values). Never commit `.env.local`.

## Supabase setup

1. Create a Supabase project on the free plan.
2. In the SQL Editor, run [`supabase/migrations/202609260001_initial_schema.sql`](supabase/migrations/202609260001_initial_schema.sql). It creates the `users` and `otps` tables, uniqueness constraints for email/customer/account numbers, RLS, and the atomic OTP-consumption function.
3. Copy the project URL, anon key, and service-role key to `.env.local` or Vercel environment variables.
4. Create an admin Auth user. In the SQL Editor, grant the role to that exact account: `update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where email = 'admin@example.com';`. Keep admin account creation restricted to trusted operators.
5. Visit `/admin/login`; only Supabase Auth accounts whose `app_metadata.role` equals `admin` can see the registry.

The server uses the service role only inside server modules. Browser access to participant tables is revoked; admin authorization is checked before a privileged registry query.

## Resend setup

Create a Resend account on its available free tier, create an API key, verify a sending domain, and set `RESEND_API_KEY` and `EMAIL_FROM`. Resend account/domain verification and sending limits apply; test delivery before opening registration.

## Paystack setup

1. Create/configure a Paystack account and begin with test API keys.
2. Confirm Dedicated Virtual Accounts are enabled and available for the account/business, then set an optional supported `PAYSTACK_PREFERRED_BANK`.
3. Register a webhook URL: `https://YOUR_HOST/api/webhooks/paystack`. Subscribe to `charge.success`. Webhooks must reach the deployed HTTPS endpoint.
4. Test customer creation, DVA assignment, exact ₦2,000 NGN transfer, webhook delivery, and email confirmation in Paystack test mode before switching to live keys.

The API persists a returned account number only for the requesting verified participant. A database `UNIQUE` constraint prevents any account number from being assigned to two users. The webhook checks Paystack's SHA-512 signature and only marks a record paid for a successful NGN charge of exactly 200,000 kobo. Provider payloads and DVA availability can vary by account; verify the enabled Paystack product and event behavior with the account before launch.

## Deploy to Vercel

Import the repository into Vercel using the free Hobby plan, set all production environment variables, deploy, then configure the Paystack webhook with the production URL. Configure the same variables for Preview only with test keys. Never put secret keys in client-prefixed variables.

The app has no monthly subscription requirement in its design, but third-party free plans have quotas and eligibility limits. Paystack may charge transaction fees, and DVA access may require account verification/approval; Resend and Supabase free-tier limits also apply. “Free services” cannot guarantee zero payment-processing cost or unrestricted provider availability.

## Editable empowerment tracks

Edit `src/lib/empowerment-types.ts`. The admin screen resolves stored values through the same configuration. Existing registrations retain their saved key if an option is later renamed or removed.

## Security notes

- OTPs are randomly generated, stored as keyed HMAC hashes, expire after 10 minutes, and are consumed atomically.
- Participant sessions use short-lived, HTTP-only, same-site cookies signed with `SESSION_SECRET`.
- Supabase service-role credentials and payment/email secrets are server-only.
- The Paystack webhook validates signatures and refuses amounts/currencies outside the expected fee.
- Before a public launch, add operational alerting/periodic reconciliation for failed confirmation emails and verify provider rate/usage limits.
