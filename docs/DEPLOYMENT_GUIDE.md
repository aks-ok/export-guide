# 🚀 ExportRight Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Step 1: Create Backup**
```bash
# Windows (PowerShell)
.\scripts\create-backup.ps1

# Linux/Mac
chmod +x scripts/create-backup.sh
./scripts/create-backup.sh
```

### ✅ **Step 2: Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your production values
# REACT_APP_SUPABASE_URL=your_production_supabase_url
# REACT_APP_SUPABASE_ANON_KEY=your_production_anon_key
```

### ✅ **Step 3: Build Test**
```bash
# Install dependencies
npm install

# Test build locally
npm run build

# Test the build
npm run start
```

---

## 🌐 **Deployment Options**

### **Option 1: Vercel (Recommended - Easiest)**

#### **Quick Deploy**
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

#### **GitHub Integration**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
6. Deploy!

**✅ Benefits:**
- Automatic HTTPS
- Global CDN
- Automatic deployments from Git
- Free tier available
- Perfect for React apps

---

### **Option 2: Netlify**

#### **Drag & Drop Deploy**
1. Build your project: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `build` folder to Netlify
4. Configure environment variables in Site Settings

#### **Git Integration**
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables
5. Deploy!

**✅ Benefits:**
- Easy drag & drop
- Form handling
- Serverless functions
- Free tier available

---

### **Option 3: AWS S3 + CloudFront**

#### **Setup S3 Bucket**
```bash
# Install AWS CLI
# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://your-exportright-bucket

# Enable static website hosting
aws s3 website s3://your-exportright-bucket --index-document index.html --error-document error.html
```

#### **Deploy to S3**
```bash
# Build project
npm run build

# Upload to S3
aws s3 sync build/ s3://your-exportright-bucket --delete

# Set public read permissions
aws s3api put-bucket-policy --bucket your-exportright-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-exportright-bucket/*"
    }
  ]
}'
```

#### **Setup CloudFront (Optional)**
1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Configure custom domain
4. Enable HTTPS

**✅ Benefits:**
- Full AWS integration
- Scalable
- Custom domain support
- Professional setup

---

### **Option 4: Docker Deployment**

#### **Build Docker Image**
```bash
# Build the image
docker build -t exportright .

# Run locally to test
docker run -p 80:80 exportright
```

#### **Deploy to Cloud**
```bash
# Tag for registry
docker tag exportright your-registry/exportright:latest

# Push to registry
docker push your-registry/exportright:latest

# Deploy to your cloud provider
```

**✅ Benefits:**
- Consistent environments
- Easy scaling
- Works anywhere
- Professional deployment

---

### **Option 5: GitHub Pages**

#### **Setup GitHub Pages**
1. Install gh-pages package:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json:
   ```json
   {
     "homepage": "https://yourusername.github.io/exportright",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

**✅ Benefits:**
- Free hosting
- Automatic from Git
- Custom domains supported
- Simple setup

---

## 🔧 **Environment Variables Setup**

### **Required Variables**
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional API Keys (for enhanced features)
REACT_APP_EMAILJS_SERVICE_ID=your-service-id
REACT_APP_EMAILJS_TEMPLATE_ID=your-template-id
REACT_APP_EMAILJS_USER_ID=your-user-id

# Analytics (Optional)
REACT_APP_GA_TRACKING_ID=your-ga-id
```

### **Platform-Specific Setup**

#### **Vercel**
```bash
# Set environment variables
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_ANON_KEY
```

#### **Netlify**
1. Go to Site Settings → Environment Variables
2. Add each variable with its value

#### **AWS/Docker**
- Use AWS Parameter Store or Secrets Manager
- Set environment variables in container configuration

---

## 🗄️ **Database Setup**

### **Supabase Setup**
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your URL and anon key

2. **Run Migrations**
   ```sql
   -- Run these in Supabase SQL Editor in order:
   -- 1. migrations/001_create_export_tables.sql
   -- 2. migrations/002_create_contact_enhancement_tables.sql
   -- 3. migrations/003_create_admin_user_management_tables.sql
   -- 4. migrations/004_create_export_data_functions.sql
   -- 5. migrations/005_performance_optimizations.sql
   ```

3. **Configure Row Level Security**
   - Enable RLS on all tables
   - Set up authentication policies

---

## 🔒 **Security Checklist**

### **Before Deployment**
- [ ] Remove all `.env` files from repository
- [ ] Use `.env.example` template only
- [ ] Enable HTTPS (automatic with Vercel/Netlify)
- [ ] Configure CORS properly
- [ ] Set up proper authentication
- [ ] Enable Row Level Security in Supabase
- [ ] Review API key permissions

### **After Deployment**
- [ ] Test all functionality
- [ ] Verify environment variables
- [ ] Check API connections
- [ ] Test authentication flow
- [ ] Verify database connections
- [ ] Monitor error logs

---

## 📊 **Performance Optimization**

### **Build Optimization**
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### **CDN Setup**
- Use Vercel/Netlify CDN (automatic)
- Or configure CloudFront for AWS
- Enable gzip compression
- Set proper cache headers

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Build Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Environment Variables Not Working**
- Ensure variables start with `REACT_APP_`
- Restart development server after changes
- Check deployment platform variable setup

#### **API Calls Failing**
- Verify CORS settings
- Check API keys and URLs
- Ensure HTTPS in production

#### **Supabase Connection Issues**
- Verify URL and anon key
- Check RLS policies
- Ensure database is accessible

---

## 📈 **Monitoring & Analytics**

### **Setup Google Analytics**
1. Create GA4 property
2. Add tracking ID to environment variables
3. Verify tracking in GA dashboard

### **Error Monitoring**
- Use Vercel Analytics (automatic)
- Or integrate Sentry for detailed error tracking
- Monitor API response times

### **Performance Monitoring**
- Use Lighthouse for performance audits
- Monitor Core Web Vitals
- Set up uptime monitoring

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions (Included)**
The project includes automated CI/CD in `.github/workflows/ci-cd.yml`:

- ✅ Runs tests on every push
- ✅ Builds the project
- ✅ Deploys to production on main branch
- ✅ Runs security scans
- ✅ Performance audits

### **Manual Deployment Commands**
```bash
# Quick deployment to Vercel
npm run deploy:vercel

# Build and deploy to S3
npm run deploy:aws

# Docker deployment
npm run deploy:docker
```

---

## 🎯 **Recommended Deployment Path**

### **For Beginners: Vercel**
1. Create backup: `.\scripts\create-backup.ps1`
2. Push to GitHub
3. Connect to Vercel
4. Add environment variables
5. Deploy!

### **For Production: AWS**
1. Create backup
2. Set up S3 + CloudFront
3. Configure custom domain
4. Set up monitoring
5. Deploy with CI/CD

### **For Enterprise: Docker + Kubernetes**
1. Create backup
2. Build Docker image
3. Deploy to container registry
4. Set up Kubernetes cluster
5. Configure load balancing

---

## 📞 **Support**

If you encounter issues during deployment:

1. **Check the logs** in your deployment platform
2. **Verify environment variables** are set correctly
3. **Test locally** with production build
4. **Check API connections** and database access
5. **Review security settings** and CORS configuration

---

## 🎉 **Post-Deployment**

After successful deployment:

1. ✅ **Test all features** thoroughly
2. ✅ **Set up monitoring** and analytics
3. ✅ **Configure backups** and disaster recovery
4. ✅ **Document** your deployment process
5. ✅ **Share** your ExportRight platform with users!

---

**Your ExportRight platform is now ready for the world! 🚀**