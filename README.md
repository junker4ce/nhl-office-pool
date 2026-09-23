# NHL Office Pool

Season-long NHL office pool manager built with Next.js, Prisma, PostgreSQL, and NextAuth.

## Local setup

1. Install dependencies.
2. Ensure PostgreSQL is running locally.
3. Create a database named `nhl_office_pool` or update `DATABASE_URL` in `.env`.
4. Apply the schema.
5. Start the app.

```bash
npm install
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

## Environment

The app expects these variables in `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nhl_office_pool?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change_me_to_a_long_random_string"
```

If PostgreSQL is stopped or unreachable, account creation and login will fail.
If `NEXTAUTH_SECRET` changes or is missing, existing session cookies can no longer be decrypted. Clear the browser cookies for `localhost` and sign in again after updating the secret.

## Admin account

The first account created through the sign-up page is assigned the `ADMIN` role automatically.
