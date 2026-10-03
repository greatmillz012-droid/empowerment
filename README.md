# NextGen Youth Empowerment Registration

Next.js 14 App Router registration platform using Neon Postgres, Resend, Flutterwave virtual accounts, and Vercel-compatible route handlers. Participants register, verify email by a one-use six-digit code, choose an empowerment track, and pay the ₦2,000 form-purchase fee by bank transfer. Admin access uses one server-configured credential pair and signed HTTP-only sessions.

## Local setup

1. Install Node.js 20 or newer and npm.
2. Copy `.env.example` to `.env.local` and fill in the values below.
3. Run `npm install` and `npm run dev`; open `http://localhost:3000`.
4. Apply the Neon migration in the SQL Editor before using registration.
5. Run `npm run build` before deploying.

### Environment variables

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Neon Console > Connection Details | Use the pooled connection string for serverless deployments, with SSL enabled (`sslmode=require`). Server-only. |
| `ADMIN_EMAIL` | Choose a dedicated administrator email | Compared only on the server; never expose it using a `NEXT_PUBLIC_` prefix. |
| `ADMIN_PASSWORD` | Generate a long unique password | Server-only. Store in `.env.local` and deployment secrets. |
| `RESEND_API_KEY` | Resend API keys | Server-only transactional email key. |
| `EMAIL_FROM` | Verified sender in Resend | For example `NextGen <updates@your-domain.example>`. Verify the sending domain first. |
| `FLW_SECRET_KEY` | Flutterwave Dashboard > Settings > API Keys | Use a test secret key until end-to-end testing is complete. |
| `FLW_SECRET_HASH` | Flutterwave Dashboard > Webhooks | Set the same secret hash configured for the webhook endpoint. |
| `SESSION_SECRET` | Generate locally | At least 32 random characters; signs participant and admin cookies. |
| `OTP_SECRET` | Generate locally | A different 32+ random characters; HMAC-hashes OTPs at rest. |
| `NEXT_PUBLIC_SITE_URL` | Your local/deployed origin | `http://localhost:3000` locally; deployed origin in Vercel. |

Generate `SESSION_SECRET` and `OTP_SECRET` with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` (run it twice for independent values). Never commit `.env.local`.

## Neon setup

1. Create a Neon project on the free plan.
2. In the Neon SQL Editor, run [`neon/migrations/001_initial_schema.sql`](neon/migrations/001_initial_schema.sql). It creates `users`, `otps`, uniqueness constraints for email, Flutterwave transaction references, and virtual account numbers, plus an atomic OTP-consumption function.
3. Copy the pooled connection string from Neon Connection Details to `DATABASE_URL`. Keep it server-only and require SSL.
4. Set `ADMIN_EMAIL` and a long, unique `ADMIN_PASSWORD` in `.env.local` and in Vercel environment variables. The application has no public admin registration endpoint.
5. Visit `/admin/login`. Admin routes verify a signed 12-hour HTTP-only cookie and compare its email with the configured administrator email.

All database access is server-side through Neon’s parameterized SQL interface. Do not expose `DATABASE_URL` in browser code. Account-number uniqueness is enforced by a Postgres unique constraint, not only application logic.

### Moving existing Supabase data

Changing the application connection does not copy existing rows. If the old Supabase database contains registrations that must be retained, export the `public.users` and `public.otps` data and import it into Neon after creating the schema. Preserve UUIDs, `created_at`, payment references, and virtual-account numbers; verify row counts and the unique constraints before switching production traffic. Do not import Supabase internal `auth` tables; administrator access now comes from the configured environment credentials.

## Resend setup

Create a Resend account on its available free tier, create an API key, verify a sending domain, and set `RESEND_API_KEY` and `EMAIL_FROM`. Resend account/domain verification and sending limits apply; test delivery before opening registration.

## Flutterwave setup

1. Create/configure a Flutterwave business account and begin with test API keys.
2. Confirm virtual-account creation for NGN is enabled for the merchant account. Flutterwave may require account review or additional identity/business verification before issuing accounts.
3. Configure a webhook URL: `https://YOUR_HOST/api/webhooks/flutterwave`. Copy the webhook secret hash into `FLW_SECRET_HASH`. Webhooks must reach the deployed HTTPS endpoint.
4. Test account issuance, an exact ₦2,000 NGN bank transfer, `charge.completed` delivery, server-side transaction verification, and confirmation email in Flutterwave test mode before switching to live keys.

The API requests an amount-scoped, non-permanent virtual account for NGN 2,000 and persists the returned number only for the requesting verified participant. A Neon `UNIQUE` constraint prevents one account number from being assigned to two users. Non-permanent accounts are not guaranteed to be reusable indefinitely; confirm Flutterwave's expiry rules for your account and issue a replacement if one expires. Flutterwave's webhook secret hash is checked, then the transaction is fetched from Flutterwave and accepted only when it is successful, exactly NGN 2,000, and carries the expected per-user transaction reference.

This setup deliberately uses non-permanent accounts so registration does not collect and store a participant's BVN. If Flutterwave requires permanent virtual accounts for your use case, its current merchant requirements may require customer identity data; confirm this with Flutterwave before adding sensitive identity fields to the application.

For an already deployed Paystack database, apply [`neon/migrations/002_flutterwave.sql`](neon/migrations/002_flutterwave.sql) after backing up the database. It drops the Paystack customer-code column, adds the Flutterwave transaction-reference column, and clears unpaid Paystack account details so the app will not present them as valid Flutterwave accounts.

## Deploy to Vercel

Import the repository into Vercel using the free Hobby plan, set all production environment variables, deploy, then configure the Flutterwave webhook with the production URL. Configure Preview with test keys and a suitable Neon database branch. Never expose database, email, payment, or administrator secrets to the client.

The app has no monthly subscription requirement in its design, but third-party free plans have quotas and eligibility limits. Flutterwave may charge transaction fees, and virtual-account access may require account verification/approval; Neon, Resend, and Vercel free-tier limits also apply. “Free services” cannot guarantee zero payment-processing cost or unrestricted provider availability.

## Editable empowerment tracks

Edit `src/lib/empowerment-types.ts`. The admin screen resolves stored values through the same configuration. Existing registrations retain their saved key if an option is later renamed or removed.

## Security notes

- OTPs are randomly generated, stored as keyed HMAC hashes, expire after 10 minutes, and are consumed atomically with a five-attempt limit.
- Participant and administrator sessions use HTTP-only, same-site cookies signed with `SESSION_SECRET`.
- Neon, Flutterwave, Resend, and admin credentials are server-only.
- The Flutterwave webhook validates its secret hash, verifies the transaction server-side, and refuses amounts/currencies outside the expected fee.
- Before a public launch, add operational alerting/periodic reconciliation for failed confirmation emails and verify provider rate/usage limits.
