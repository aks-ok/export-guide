# Vercel Deployment Checklist for ExportRight Platform

## ✅ Pre-Deployment Checklist

### Code Preparation
- [x] **vercel.json** configuration file created
- [x] **Environment variables** properly configured in .env
- [x] **Build script** verified in package.json
- [x] **TypeScript configuration** optimized
- [x] **All dependencies** listed in package.json

### Database Setup
- [ ] **Supabase project** is running and accessible
- [ ] **Database migrations** have been executed:
  - [ ] 001_create_export_tables.sql
  - [ ] 002_create_contact_enhancement_tables.sql
  - [ ] 003_create_admin_user_management_tables.sql
  - [ ] 004_create_export_data_functions.sql
  - [ ] 005_performance_optimizations.sql
  - [ ] 006_create_quotations_table.sql

### API Keys Verification
- [x] **UN Comtrade API** keys configured
- [x] **MCA (Ministry of Corporate Affairs)** keys configured
- [x] **Indian Post Office API** endpoint configured
- [x] **Google Analytics** tracking ID configured
- [x] **Supabase** URL and anon key configured

## 🚀 Deployment Steps

### Step 1: Local Testing
```bash
# Test local build
npm run build

# Test local server (optional)
npm start
```

### Step 2: Deploy to Vercel
```bash
# Option A: Use deployment script
./deploy-to-vercel.ps1

# Option B: Manual deployment
vercel login
vercel --prod
```

### Step 3: Configure Vercel Environment Variables
In Vercel Dashboard > Settings > Environment Variables, add:

```
REACT_APP_SUPABASE_URL=https://jbrfnhfmtuffarfzsaka.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpicmZuaGZtdHVmZmFyZnpzYWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NTkwMDUsImV4cCI6MjA3MTMzNTAwNX0.cTBKYNHoZA8x2YoDSKuV6fAinXPl2bK8AURht2sRIKc
REACT_APP_COMTRADE_PRIMARY_KEY=3b240617cb57407fb507e59fd8d27ddd
REACT_APP_COMTRADE_SECONDARY_KEY=2c6e05a2812a47fd9c3c609d05f71958
REACT_APP_MCA_APP_NAME=OX06Xqf8YexItsCtVi
REACT_APP_MCA_APP_ID=f9da8c82dea9a2a7cfa34e7bd2061c5c
REACT_APP_MCA_APP_SECRET=5b6a4a860a5bb2fc690a80e2e4650570a83cee38a997c379
REACT_APP_MCA_API_TOKEN=T1gwNlhxZjhZZXhJdHNDdFZpLmY5ZGE4YzgyZGVhOWEyYTdjZmEzNGU3YmQyMDYxYzVjOjViNmE0YTg2MGE1YmIyZmM2OTBhODBlMmU0NjUwNTcwYTgzY2VlMzhhOTk3YzM3OQ==
REACT_APP_INDIAN_POSTOFFICE_API_BASE=https://api.postalpincode.in
REACT_APP_GA_MEASUREMENT_ID=G-9E88FVDNYX
```

### Step 4: Configure Supabase for Production
1. **Add Vercel domain to Supabase**:
   - Go to Supabase Dashboard > Settings > API
   - Add your Vercel URL to "Site URL"
   - Add auth callback URLs

2. **Update CORS settings** (if needed):
   - Allow your Vercel domain in Supabase CORS settings

## 🧪 Post-Deployment Testing

### Functional Testing
- [ ] **Homepage loads** correctly
- [ ] **User authentication** works (login/signup)
- [ ] **Navigation** between pages works
- [ ] **API calls** are successful:
  - [ ] UN Comtrade data fetching
  - [ ] MCA company data retrieval
  - [ ] Indian Post Office PIN code lookup
  - [ ] Supabase database operations

### Feature Testing
- [ ] **Export Compliance** checking works
- [ ] **Market Research** data displays correctly
- [ ] **Lead Generation** functionality works
- [ ] **Contact Management** CRUD operations
- [ ] **Analytics Dashboard** displays data
- [ ] **Quotation System** works properly

### Performance Testing
- [ ] **Page load times** are acceptable (<3 seconds)
- [ ] **Mobile responsiveness** works correctly
- [ ] **API response times** are reasonable
- [ ] **Error handling** displays user-friendly messages

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Build Failures**:
   ```bash
   # Check for TypeScript errors
   npm run build
   
   # Fix any compilation errors
   # Ensure all imports are correct
   ```

2. **Environment Variable Issues**:
   - Verify all variables start with `REACT_APP_`
   - Check Vercel dashboard environment variables
   - Redeploy after adding new variables

3. **API Connection Issues**:
   - Check network tab in browser dev tools
   - Verify API keys are correct
   - Check CORS settings

4. **Supabase Connection Issues**:
   - Verify Supabase URL and key
   - Check Supabase project status
   - Verify domain whitelist in Supabase

## 📊 Monitoring Setup

### Analytics
- [x] **Google Analytics** configured (G-9E88FVDNYX)
- [ ] **Vercel Analytics** enabled (optional)

### Error Tracking
- [ ] **Sentry** or similar error tracking (recommended)
- [ ] **LogRocket** for session replay (optional)

### Performance Monitoring
- [ ] **Vercel Speed Insights** enabled
- [ ] **Core Web Vitals** monitoring

## 🔒 Security Checklist

- [x] **Environment variables** not exposed in client code
- [ ] **Supabase RLS policies** enabled and tested
- [x] **HTTPS** enforced (automatic with Vercel)
- [ ] **Content Security Policy** configured (optional)
- [ ] **Rate limiting** implemented for APIs

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ All core features work as expected
- ✅ API integrations are functional
- ✅ Database operations work correctly
- ✅ Performance meets requirements
- ✅ Mobile experience is smooth

## 📞 Support Resources

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Project Documentation**: See docs/ folder

---

**Ready to deploy?** Run `./deploy-to-vercel.ps1` to start the deployment process!