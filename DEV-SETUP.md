# Developer Setup Guide

This guide will help you set up the Lamplight project for local development.

## Prerequisites

- **Node.js** (v18 or higher) and npm
- **Git**
- **VSCode** (recommended)

## 1. Clone the Repository

```bash
git clone <repository-url>
cd t4sg-lamplight
```

## 2. Install Dependencies

```bash
npm install
```

You should see VSCode prompts to install recommended extensions. Accept them — they help with formatting and linting.

## 3. Set Up Environment Variables

Create a `.env.local` file in the project root. Ask the project admin for the values:

```bash
# Copy the example file
cp .env.example .env.local
```

Required variables:

| Variable                        | Description                               |
| ------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key                  |
| `SUPABASE_PROJECT_REF`          | Supabase project ID (for type generation) |

Optional (for Google OAuth locally):

| Variable                                      | Description                |
| --------------------------------------------- | -------------------------- |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`     | Google OAuth client ID     |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

**Note:** The admin will provide these values. Never commit `.env.local` to version control.

## 4. Run the Development Server

```bash
npm run dev
```

The app should be running at [http://localhost:3000](http://localhost:3000).

## 5. Common Commands

| Command            | Description                               |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start development server                  |
| `npm run build`    | Create production build                   |
| `npm run lint`     | Check for linting errors                  |
| `npm run lint:fix` | Auto-fix linting errors                   |
| `npm run format`   | Format code and fix linting               |
| `npm run types`    | Regenerate TypeScript types from database |

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── dashboard/          # Main dashboard (students, sessions)
│   ├── settings/           # User and admin settings
│   └── usage/              # User documentation page
├── components/             # Reusable UI components
│   ├── global/             # App-wide components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities and data fetching
│   ├── client-utils.ts     # Browser-side Supabase client
│   ├── server-utils.ts     # Server-side Supabase client
│   ├── lookup-data.ts      # Cached data fetching for lookups
│   └── schema.ts           # Auto-generated database types
├── migrations/             # SQL migration files
└── middleware.ts           # Auth and session management
```

## Key Concepts

### Authentication

- Uses Supabase Auth with Google OAuth
- Middleware handles session refresh
- Two roles: `admin` and `teacher`
- Admins can manage programs, courses, and permissions

### Database

- **Students**: Core student records
- **Sessions**: Course offerings (course + quarter + year)
- **Enrollments**: Tracks which students are in which sessions
- **Programs/Courses/Assessments**: Lookup tables managed by admins

### Data Fetching

- Server components fetch data directly with `createServerSupabaseClient()`
- Use `cache()` wrapper from React for request-level caching
- Lookup data (programs, courses) is cached via `lib/lookup-data.ts`

## Updating Database Types

After making changes to the database schema in Supabase:

```bash
npm run types
```

This regenerates `lib/schema.ts` with the latest types.

## Running Migrations

SQL migration files are in the `migrations/` folder. Run them manually in the Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL
4. Run it

## Troubleshooting

### "Cannot connect to Docker daemon"

The `npm run types` command requires Docker. Make sure Docker Desktop is running.

### TypeScript errors after pulling changes

Try regenerating types:

```bash
npm run types
```

### Authentication not working

1. Check that your `.env.local` has the correct Supabase URL and keys
2. Make sure your email is in the `allowed_emails` table in Supabase
3. Check that redirect URLs are configured in Supabase (Authentication > URL Configuration)

## Need Help?

- Check the detailed setup guide in `SSWE-SETUP-README.md`
- Ask the project admin for environment variables and database access
