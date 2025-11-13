# HUNKCentral - Log Management System

**A specialized daily log management system for College Hunks crew members to record work hours, jobs, and activities.**

## 🚀 Features

### ✅ Log Form Improvements (Recently Implemented)

- **5-Minute Time Increments**: Track time in 5-minute intervals (4.33 for 4:20, 4.08 for 4:05)
- **Date Selector**: Flexible date selection with today as default and past dates available
- **Captain Auto-Selection**: Captain automatically selected when adding team members
- **Smart Employee Filtering**: Prevent duplicate employee selections within sections
- **Department-Specific Hours**: Other Hours section properly filters to Training/Admin/Warehouse/Estimating/Zigma only

### 🎯 Core Functionality

- **Multi-Section Daily Logs**: Junk jobs, Move jobs, and Other hours tracking
- **Team Management**: Add crew members with role assignments and co-captain designation
- **Revenue Tracking**: Job revenue, tips, and disposal costs
- **Offline Support**: Auto-save functionality and offline data persistence
- **Role-Based Access**: Captains, managers, and admin roles with appropriate permissions

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **UI Library**: Shadcn/ui with New York theme
- **Styling**: Tailwind CSS with College Hunks brand colors
- **Database**: Supabase-hosted PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form + Zod validation

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- npm and a GitHub account
- A Supabase project (create one at [supabase.com](https://supabase.com))

### Installation

1. **Clone this repository**

   ```bash
   git clone <your-new-repo-url>
   cd hunkcentral-log-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create your Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and API keys

4. **Set up environment variables**
   Copy `.env` to `.env.local` and update with your Supabase credentials:

   ```bash
   cp .env .env.local
   ```

   Update these values in `.env.local`:
   - `DATABASE_URL` - From Supabase project settings
   - `NEXT_PUBLIC_SUPABASE_URL` - Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

5. **Set up the database**

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

6. **Start development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Default Login Credentials

After seeding the database, you can use these credentials:

- **Admin**: `admin@collegehunks.com` / `admin123`
- **Captain**: `captain@collegehunks.com` / `captain123`
- **Manager**: `manager@collegehunks.com` / `manager123`
- **Sales**: `sales@collegehunks.com` / `sales123`
- **Wingman**: `wingman@collegehunks.com` / `wingman123`

## 🚀 Deployment

### Vercel Deployment

1. Create a new Vercel project
2. Connect your GitHub repository
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Required Environment Variables for Production

- `DATABASE_URL` - Supabase database connection string
- `NEXTAUTH_URL` - Your Vercel app URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- Supabase URL and Keys from your project settings

## 📂 Project Structure

```
/app
  /auth                → Login and authentication
  /(protected)         → Protected routes
    /logs              → Log creation and management
    /dashboard         → Dashboard views

/components/features/logs
  ├── captain-log-form.tsx        → Main log creation form
  ├── team-hours-section.tsx      → Employee hours tracking
  └── job-section.tsx            → Job management

/lib
  ├── actions/logs.ts             → Log server actions
  ├── payCalculator.ts           → Payroll calculations
  └── validations.ts             → Form validation schemas
```

## 🎨 College Hunks Brand Colors

- **Primary Green**: `#026937`
- **Secondary Orange**: `#ea7200`

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npx prisma studio` - Open database admin interface

## 🤝 Contributing

This is a private project for College Hunks Hauling Junk & Moving personnel.

## 📄 License

Private project - College Hunks Hauling Junk & Moving
