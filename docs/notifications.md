# Resident notifications

StayHub sends resident email through Resend and WhatsApp messages through the
official Meta Cloud API. Delivery runs only in server code after a successful
business mutation. A database ledger prevents duplicate delivery per event and
channel.

Apply the migration
supabase/migrations/20260811150000_add_notification_deliveries.sql through the
normal reviewed migration process before enabling notifications. Do not expose
any provider setting with a NEXT_PUBLIC_ prefix.

## Server environment

    RESEND_API_KEY=
    NOTIFICATION_EMAIL_FROM=
    NOTIFICATION_EMAIL_FROM_NAME=StayHub
    NEXT_PUBLIC_SITE_URL=https://your-stayhub-domain.example

    WHATSAPP_ACCESS_TOKEN=
    WHATSAPP_PHONE_NUMBER_ID=
    WHATSAPP_API_VERSION=v23.0
    WHATSAPP_TEMPLATE_LANGUAGE_CODE=en_US
    WHATSAPP_DEFAULT_COUNTRY_CODE=

    WHATSAPP_TEMPLATE_ADMISSION_CREATED=
    WHATSAPP_TEMPLATE_BILL_GENERATED=
    WHATSAPP_TEMPLATE_RECEIPT_SUBMITTED=
    WHATSAPP_TEMPLATE_PAYMENT_VERIFIED=
    WHATSAPP_TEMPLATE_PAYMENT_REJECTED=
    WHATSAPP_TEMPLATE_CONTRACT_APPROVED=
    WHATSAPP_TEMPLATE_RESIDENT_NOTICE_CREATED=
    WHATSAPP_TEMPLATE_RESIDENT_LOGIN_DETAILS_SENT=

WHATSAPP_DEFAULT_COUNTRY_CODE must contain digits only, such as 92. Local phone
numbers are skipped if it is unset; international numbers beginning with + or
00 are normalized without guessing a country.

## Meta template body variables

1. Admission created: name, room, bed, admission date, rent, deposit,
   admission status, contract status.
2. Bill generated: name, bill number, billing month, amount, type, due date,
   outstanding.
3. Receipt submitted: name, bill number, amount, status.
4. Payment verified: name, bill number, amount, paid total, outstanding,
   bill status, fully-paid note.
5. Payment rejected: name, bill number, amount, rejection reason.
6. Contract approved: name, contract status, deposit status, admission status,
   activation note.
7. Resident notice created: name, notice title, short description, published
   date, resident notice portal URL.
8. Resident login details: name, login email, one-time Supabase password setup
   link, resident portal URL.

`NEXT_PUBLIC_SITE_URL` is used to build resident portal links and the approved
Supabase recovery redirect URL. Add
`https://your-stayhub-domain.example/resident-portal/change-password` to the
Supabase Auth redirect allow list.

SMS is intentionally a tracked placeholder. When selected, a resident with a
phone number receives `configuration_required` in the notification ledger;
no external SMS request is made until an SMS provider adapter is implemented.

When a provider is not configured, no external request is made. The business
record remains saved and the user receives only a generic delivery warning.
