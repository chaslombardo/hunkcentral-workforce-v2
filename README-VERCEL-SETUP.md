# Vercel Deployment Setup for HUNKCentral

This guide walks you through setting up Vercel for both preview and production deployments of HUNKCentral.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Supabase Projects**: You'll need separate Supabase projects for production and preview

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

## Step 2: Link Your Project

From your project root:

```bash
vercel link
```

Follow the prompts to:

- Select your team (if applicable)
- Link to existing project or create new one
- Choose your project name (e.g., `hunkcentral-v2`)

## Step 3: Set Up Environment Variables

### Production Environment Variables

In the Vercel dashboard, go to your project → Settings → Environment Variables and add:

```bash
# Database
DATABASE_URL=postgresql://postgres:[PROD-PASSWORD]@db.[PROD-PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=https://your-production-domain.vercel.app
NEXTAUTH_SECRET=your-production-nextauth-secret-32-chars-min

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-supabase-service-role-key
```

**Environment**: Production

### Preview Environment Variables

Add the same variables but with preview/staging values:

```bash
# Database
DATABASE_URL=postgresql://postgres:[PREVIEW-PASSWORD]@db.[PREVIEW-PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=https://your-preview-domain.vercel.app
NEXTAUTH_SECRET=your-preview-nextauth-secret-32-chars-min

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-preview-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-preview-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-preview-supabase-service-role-key
```

**Environment**: Preview

## Step 4: Configure Build Settings

In Vercel dashboard → Settings → General:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave empty)
- **Build Command**: `npm run vercel:build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm ci`
- **Development Command**: `npm run vercel:dev`

## Step 5: Set Up Domains

### Production Domain

1. Go to Settings → Domains
2. Add your custom domain (e.g., `hunkcentral.com`)
3. Configure DNS records as instructed

### Preview Domain

Preview deployments automatically get unique URLs like:
`hunkcentral-v2-git-feature-branch-yourteam.vercel.app`

## Step 6: Configure Git Integration

### Automatic Deployments

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from all other branches and PRs

### Branch Protection

In your GitHub repository:

1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Require status checks to pass (including Vercel deployment)

## Step 7: Database Setup

### Production Database

1. Create a new Supabase project for production
2. Run migrations: `npx prisma migrate deploy`
3. Seed initial data: `npm run db:seed`

### Preview Database

1. Create a separate Supabase project for preview/staging
2. Use the same migration and seed process

## Deployment Commands

### Manual Deployments

```bash
# Deploy to preview
npm run deploy:preview

# Deploy to production
npm run deploy:production

# Or use Vercel CLI directly
vercel --prod=false  # Preview
vercel --prod        # Production
```

### Automatic Deployments

- **Push to `main`**: Triggers production deployment
- **Push to any other branch**: Triggers preview deployment
- **Open PR**: Creates preview deployment with unique URL

## Environment-Specific Features

### Production

- Full database migrations
- Performance optimizations enabled
- Error tracking and analytics
- Custom domain
- CDN caching optimized

### Preview

- Safe database migrations
- Debug logging enabled
- Preview-specific environment variables
- Temporary URLs for testing
- Branch-specific deployments

## Monitoring and Analytics

### Built-in Vercel Analytics

- Automatically enabled for production
- Real-time performance metrics
- Core Web Vitals tracking

### Custom Monitoring

- Error boundaries capture client-side errors
- Server-side error logging
- Performance monitoring hooks

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set correctly
   - Ensure database is accessible
   - Verify Prisma schema is valid

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Supabase project is active
   - Ensure connection pooling is configured

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check NEXTAUTH_SECRET is set and secure
   - Ensure callback URLs are configured

### Debug Commands

```bash
# Check build locally
npm run build

# Test database connection
npx prisma db push --preview-feature

# Verify environment variables
vercel env ls
```

## Security Considerations

1. **Environment Variables**: Never commit real environment variables to git
2. **Database Access**: Use connection pooling and read replicas for production
3. **Authentication**: Use strong secrets and secure session configuration
4. **HTTPS**: Always use HTTPS in production (automatic with Vercel)
5. **Headers**: Security headers are configured in `vercel.json`

## Performance Optimization

1. **Image Optimization**: Automatic with Next.js Image component
2. **Bundle Analysis**: Run `npm run analyze` to check bundle size
3. **Caching**: Static assets cached automatically
4. **Edge Functions**: API routes run on Vercel Edge Network
5. **Database**: Use connection pooling and optimize queries

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domains
3. Set up staging environment workflows
4. Implement CI/CD pipeline with tests
5. Configure backup and disaster recovery

---

For more detailed information, see:

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
