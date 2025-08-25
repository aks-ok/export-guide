# Vercel Deployment Guide for ExportGuide Platform

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Supabase Project**: Ensure your Supabase project is set up and running

## Step 1: Prepare Your Project

### 1.1 Verify Build Configuration
Ensure your `package.json` has the correct build script:
```json
{
  "scripts": {
    "build": "react-scripts build"
  }
}
```

### 1.2 Test Local Build
Run a local build to ensure everything compiles correctly:
```bash
npm run build
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy from your project directory**:
```bash
vercel
```

4. **Follow the prompts**:
   - Link to existing project? `N`
   - Project name: `export-right-platform`
   - Directory: `./` (current directory)
   - Override settings? `N`

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to Settings > Environment Variables and add:

### Required Variables:
```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### API Keys (Already provided in .env.example):
```
REACT_APP_COMTRADE_PRIMARY_KEY=3b240617cb57407fb507e59fd8d27ddd
REACT_APP_COMTRADE_SECONDARY_KEY=2c6e05a2812a47fd9c3c609d05f71958
REACT_APP_MCA_APP_NAME=OX06Xqf8YexItsCtVi
REACT_APP_MCA_APP_ID=f9da8c82dea9a2a7cfa34e7bd2061c5c
REACT_APP_MCA_APP_SECRET=5b6a4a860a5bb2fc690a80e2e4650570a83cee38a997c379
REACT_APP_MCA_API_TOKEN=T1gwNlhxZjhZZXhJdHNDdFZpLmY5ZGE4YzgyZGVhOWEyYTdjZmEzNGU3YmQyMDYxYzVjOjViNmE0YTg2MGE1YmIyZmM2OTBhODBlMmU0NjUwNTcwYTgzY2VlMzhhOTk3YzM3OQ==
```

### Optional Variables:
```
REACT_APP_GA_TRACKING_ID=your_google_analytics_tracking_id
REACT_APP_EMAILJS_SERVICE_ID=your_emailjs_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
REACT_APP_EMAILJS_USER_ID=your_emailjs_user_id
```

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Vercel will automatically provision SSL certificates

## Step 5: Set Up Supabase for Production

### 5.1 Update Supabase URL Whitelist
In your Supabase project dashboard:
1. Go to Settings > API
2. Add your Vercel domain to the "Site URL" field:
   - `https://your-project-name.vercel.app`
   - `https://your-custom-domain.com` (if using custom domain)

### 5.2 Configure Authentication Redirects
In Supabase Auth settings, add redirect URLs:
- `https://your-project-name.vercel.app/auth/callback`
- `https://your-custom-domain.com/auth/callback`

## Step 6: Database Migration

Run your database migrations in Supabase:

1. **Connect to Supabase SQL Editor**
2. **Run migration files in order**:
   - `migrations/001_create_export_tables.sql`
   - `migrations/002_create_contact_enhancement_tables.sql`
   - `migrations/003_create_admin_user_management_tables.sql`
   - `migrations/004_create_export_data_functions.sql`
   - `migrations/005_performance_optimizations.sql`
   - `migrations/006_create_quotations_table.sql`

## Step 7: Verify Deployment

### 7.1 Check Build Logs
- Monitor the deployment in Vercel dashboard
- Check for any build errors or warnings

### 7.2 Test Core Functionality
1. **Authentication**: Test user login/signup
2. **API Connections**: Verify external API calls work
3. **Database Operations**: Test CRUD operations
4. **Navigation**: Ensure all routes work correctly

### 7.3 Performance Check
- Test page load speeds
- Verify mobile responsiveness
- Check API response times

## Step 8: Continuous Deployment

Vercel automatically deploys when you push to your main branch. To configure:

1. **Branch Protection**: Set up branch protection rules in GitHub
2. **Preview Deployments**: Vercel creates preview deployments for pull requests
3. **Production Deployments**: Only main branch deploys to production

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check TypeScript errors: `npm run build`
   - Verify all dependencies are in package.json
   - Check for missing environment variables

2. **API Errors**:
   - Verify environment variables are set correctly
   - Check CORS settings in external APIs
   - Ensure API keys are valid

3. **Supabase Connection Issues**:
   - Verify Supabase URL and keys
   - Check network policies in Supabase
   - Ensure database is accessible

4. **Routing Issues**:
   - Verify vercel.json configuration
   - Check React Router setup
   - Ensure all routes are properly defined

## Performance Optimization

### 7.1 Enable Vercel Analytics
```bash
npm install @vercel/analytics
```

Add to your main component:
```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      {/* Your app */}
      <Analytics />
    </>
  );
}
```

### 7.2 Configure Caching
The vercel.json already includes optimal caching headers for static assets.

### 7.3 Bundle Analysis
```bash
npm install --save-dev @vercel/webpack-bundle-analyzer
```

## Security Checklist

- [ ] Environment variables are properly configured
- [ ] Supabase RLS policies are enabled
- [ ] API keys are not exposed in client-side code
- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] Content Security Policy is configured
- [ ] Authentication redirects are properly configured

## Monitoring and Maintenance

1. **Set up Vercel Analytics** for performance monitoring
2. **Configure Supabase monitoring** for database performance
3. **Set up error tracking** (Sentry, LogRocket, etc.)
4. **Regular dependency updates** via Dependabot
5. **Monitor API usage** to stay within rate limits

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **React Documentation**: [reactjs.org/docs](https://reactjs.org/docs)

Your ExportRight platform is now ready for production deployment on Vercel!