# Database Setup Guide

## Supabase PostgreSQL Setup

HUNKCentral uses Supabase-hosted PostgreSQL as the primary database. Follow these steps to set up your database:

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name (e.g., "hunkcentral-v2")
3. Set a strong database password
4. Select a region close to your users

### 2. Get Database Connection String

1. In your Supabase dashboard, go to **Settings** > **Database**
2. Find the **Connection string** section
3. Copy the **URI** connection string
4. It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Replace the `DATABASE_URL` with your Supabase connection string
3. Optionally, add Supabase API keys from **Settings** > **API**

```bash
# Example .env.local
DATABASE_URL="postgresql://postgres:your-password@db.abcdefghijklmnop.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create and run migrations (for production)
npm run db:migrate

# Open Prisma Studio to view data
npm run db:studio
```

## Local Development Alternative

For local development, you can also use a local PostgreSQL instance:

### 1. Install PostgreSQL

```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb hunkcentral_dev
```

### 2. Configure Local Connection

```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/hunkcentral_dev"
```

## Database Schema Overview

The database includes the following main models:

- **User**: Employee accounts with roles and compensation settings
- **DailyLog**: Captain work logs with approval workflow
- **LogJob**: Individual jobs within daily logs (Junk/Move)
- **LogHour**: Employee hours by department
- **CommissionEntry**: Sales commission tracking
- **PayPeriod**: Payroll period management
- **AuditLog**: Change tracking and audit trail

## Security Features

- Row-level security policies (to be implemented)
- Encrypted sensitive data
- Audit logging for all changes
- Role-based access control

## Backup and Recovery

Supabase provides automatic backups. For additional safety:

1. Enable Point-in-Time Recovery in Supabase dashboard
2. Set up regular database dumps for critical data
3. Test restore procedures regularly

## Performance Optimization

- Indexes on frequently queried fields
- Connection pooling via Supabase
- Query optimization with Prisma
- Monitoring via Supabase dashboard
