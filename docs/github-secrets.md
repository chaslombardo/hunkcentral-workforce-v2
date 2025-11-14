# GitHub Secrets Configuration for HUNKCentral CI/CD

This document outlines all the GitHub secrets required for the HUNKCentral CI/CD pipeline to function properly.

## Required Secrets

### Vercel Deployment Secrets

These secrets are required for automatic deployment to Vercel:

```bash
VERCEL_TOKEN=your-vercel-token-here
VERCEL_ORG_ID=your-vercel-org-id-here
VERCEL_PROJECT_ID=your-vercel-project-id-here
```

**How to get these values:**

1. **VERCEL_TOKEN**:
   - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
   - Create a new token with appropriate permissions
   - Copy the token value

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:
   - Run `vercel link` in your project directory
   - Check the `.vercel/project.json` file for these values
   - Or find them in your Vercel project settings

### Code Quality and Security Secrets

```bash
CODECOV_TOKEN=your-codecov-token-here
SNYK_TOKEN=your-snyk-token-here
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token-here
```

**How to get these values:**

1. **CODECOV_TOKEN**:
   - Sign up at [Codecov.io](https://codecov.io)
   - Connect your GitHub repository
   - Copy the repository token from settings

2. **SNYK_TOKEN**:
   - Sign up at [Snyk.io](https://snyk.io)
   - Go to Account Settings → API Token
   - Generate and copy the token

3. **LHCI_GITHUB_APP_TOKEN**:
   - Install the [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
   - Configure it for your repository
   - Use the provided token

### Database Secrets (for testing)

These are used for running tests in CI/CD:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hunkcentral_test
```

**Note**: The CI/CD pipeline uses a PostgreSQL service container, so this URL should match the service configuration.

## Setting Up Secrets in GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its corresponding value

## Environment-Specific Configuration

### Production Environment

The production deployment uses these environment variables (set in Vercel dashboard):

```bash
DATABASE_URL=your-production-database-url
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-supabase-service-role-key
```

### Preview Environment

The preview deployment uses these environment variables (set in Vercel dashboard):

```bash
DATABASE_URL=your-preview-database-url
NEXTAUTH_URL=https://your-preview-domain.vercel.app
NEXTAUTH_SECRET=your-preview-nextauth-secret
NEXT_PUBLIC_SUPABASE_URL=your-preview-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-preview-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-preview-supabase-service-role-key
```

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Use different secrets for production and preview environments**
3. **Rotate secrets regularly (at least every 90 days)**
4. **Use the principle of least privilege for all tokens**
5. **Monitor secret usage and access logs**

## Troubleshooting

### Common Issues

1. **Vercel deployment fails**:
   - Check that VERCEL_TOKEN has the correct permissions
   - Verify VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct
   - Ensure the token hasn't expired

2. **Tests fail in CI**:
   - Verify TEST_DATABASE_URL is correctly formatted
   - Check that the PostgreSQL service is running
   - Ensure all required environment variables are set

3. **Code coverage upload fails**:
   - Verify CODECOV_TOKEN is valid
   - Check that the repository is properly configured in Codecov
   - Ensure the coverage files are being generated

4. **Security scans fail**:
   - Verify SNYK_TOKEN is valid and has the correct permissions
   - Check that the repository is properly configured in Snyk
   - Ensure dependencies are up to date

## Monitoring and Alerts

Set up monitoring for:

- Failed deployments
- Security vulnerabilities
- Code coverage drops
- Performance regressions

## Secret Rotation Schedule

| Secret          | Rotation Frequency | Last Rotated | Next Rotation |
| --------------- | ------------------ | ------------ | ------------- |
| VERCEL_TOKEN    | 90 days            | TBD          | TBD           |
| CODECOV_TOKEN   | 180 days           | TBD          | TBD           |
| SNYK_TOKEN      | 90 days            | TBD          | TBD           |
| NEXTAUTH_SECRET | 90 days            | TBD          | TBD           |

## Contact Information

For questions about secrets management:

- **DevOps Team**: devops@collegehunks.com
- **Security Team**: security@collegehunks.com
- **Project Lead**: [Your Name]

---

**Last Updated**: December 2024
**Version**: 1.0
