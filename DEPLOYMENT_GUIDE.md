# 🚀 Deployment Guide - Rasan Platform

Complete guide for deploying the Rasan platform to production.

---

## 📋 Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All features tested locally
- [ ] No console errors or warnings
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript compilation passes
- [ ] ESLint passes (`npm run lint`)

### 2. Database Setup
- [ ] Supabase project created
- [ ] All migrations applied
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] PostGIS extension enabled
- [ ] Sample data added (optional)

### 3. Third-Party Services
- [ ] Razorpay account configured
- [ ] Stripe account configured (optional)
- [ ] Google Maps API key (optional)
- [ ] Email service configured
- [ ] Error tracking setup (Sentry)

### 4. Security
- [ ] Environment variables secured
- [ ] API keys rotated for production
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SSL/TLS certificates ready

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Why Vercel?**
- Built for Next.js
- Zero configuration
- Automatic HTTPS
- Global CDN
- Serverless functions
- Free tier available

#### Step-by-Step Deployment

**1. Prepare Your Repository**
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/Rasan.git
git branch -M main
git push -u origin main
```

**2. Import to Vercel**

Visit [vercel.com](https://vercel.com) and:
1. Click "Add New Project"
2. Import your GitHub repository
3. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
   - Install Command: `npm install`

**3. Configure Environment Variables**

Add these in Vercel Dashboard > Settings > Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
```

**4. Deploy**

Click "Deploy" and wait for the build to complete.

**5. Configure Custom Domain** (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

**6. Set Up Webhooks**

For payment webhooks:

**Razorpay:**
- Dashboard > Settings > Webhooks
- Webhook URL: `https://your-domain.com/api/webhooks/razorpay`
- Events: `payment.captured`, `payment.failed`

**Stripe:**
- Dashboard > Developers > Webhooks
- Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `payment_intent.succeeded`

---

### Option 2: Netlify

**1. Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**2. Build Your Project**
```bash
npm run build
```

**3. Deploy**
```bash
netlify deploy --prod
```

**4. Configure Environment Variables**

In Netlify Dashboard > Site Settings > Environment Variables

---

### Option 3: AWS (Advanced)

**Services Required:**
- **EC2** - Application server
- **RDS** - PostgreSQL database (or use Supabase)
- **S3** - Static assets and images
- **CloudFront** - CDN
- **Route 53** - DNS management
- **Certificate Manager** - SSL certificates

**Deployment Steps:**

**1. Set Up EC2 Instance**
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/Rasan.git
cd Rasan

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "Rasan" -- start
pm2 save
pm2 startup
```

**2. Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Set Up SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 4: Docker + Any Cloud Provider

**1. Create Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**2. Create docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
    restart: unless-stopped
```

**3. Build and Run**
```bash
docker-compose up -d
```

---

## 🗄️ Database Deployment

### Supabase (Recommended)

**1. Create Production Project**
- Go to [supabase.com](https://supabase.com)
- Create new project
- Choose region closest to your users
- Note down credentials

**2. Run Migrations**

**Option A: Supabase Dashboard**
1. Go to SQL Editor
2. Copy and paste each migration file
3. Execute in order:
   - `001_initial_schema.sql`
   - `002_functions_triggers.sql`
   - `003_rls_policies.sql`

**Option B: Supabase CLI**
```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**3. Enable PostGIS**
```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

**4. Configure Storage**
- Go to Storage
- Create buckets:
  - `meal-images` (public)
  - `vendor-images` (public)
  - `profile-avatars` (public)
  - `documents` (private)

**5. Set Up Realtime**
- Go to Database > Replication
- Enable replication for tables:
  - `orders`
  - `notifications`
  - `group_orders`

---

## 🔐 Security Configuration

### 1. Environment Variables

**Never commit these to git:**
```bash
# Add to .gitignore
.env.local
.env.production
.env*.local
```

**Use different keys for production:**
- Generate new Supabase anon keys
- Use live Razorpay/Stripe keys
- Rotate all API keys

### 2. CORS Configuration

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### 3. Rate Limiting

Implement rate limiting for API routes (see PERFORMANCE_OPTIMIZATION_GUIDE.md)

### 4. Content Security Policy

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;",
          },
        ],
      },
    ];
  },
};
```

---

## 📊 Monitoring & Analytics

### 1. Vercel Analytics

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 2. Sentry Error Tracking

**Install:**
```bash
npm install @sentry/nextjs
```

**Configure:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 3. Google Analytics

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 🧪 Post-Deployment Testing

### 1. Smoke Tests

Test critical user flows:
- [ ] User registration and login
- [ ] Browse meals
- [ ] Add to cart
- [ ] Checkout process
- [ ] Payment processing
- [ ] Order tracking
- [ ] Vendor dashboard
- [ ] Admin dashboard

### 2. Performance Testing

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=https://your-domain.com
```

### 3. Load Testing

Use tools like:
- **Apache JMeter**
- **k6**
- **Artillery**

Example with k6:
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  const res = http.get('https://your-domain.com');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

Run:
```bash
k6 run load-test.js
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📝 Rollback Strategy

### Vercel Rollback

1. Go to Deployments
2. Find previous successful deployment
3. Click "..." > "Promote to Production"

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force
```

---

## 🆘 Troubleshooting

### Build Failures

**Issue:** Build fails on Vercel
```bash
# Check locally first
npm run build

# Clear cache
rm -rf .next
npm run build
```

**Issue:** TypeScript errors
```bash
# Check types
npm run type-check

# Fix auto-fixable issues
npm run lint --fix
```

### Runtime Errors

**Issue:** 500 Internal Server Error
- Check Vercel logs
- Check Supabase logs
- Verify environment variables
- Check API route implementations

**Issue:** Database connection errors
- Verify Supabase credentials
- Check RLS policies
- Verify network connectivity

### Performance Issues

**Issue:** Slow page loads
- Check Lighthouse report
- Review bundle size
- Optimize images
- Enable caching

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Web Performance Best Practices](https://web.dev/performance/)

---

## ✅ Production Checklist

### Pre-Launch
- [ ] All features tested
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Documentation complete
- [ ] Team trained

### Launch Day
- [ ] Deploy to production
- [ ] Verify all features work
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Test payment processing
- [ ] Verify email notifications

### Post-Launch
- [ ] Monitor user feedback
- [ ] Track analytics
- [ ] Fix critical bugs
- [ ] Optimize based on metrics
- [ ] Plan next iteration

---

**Need help? Contact support@Rasan.com**
