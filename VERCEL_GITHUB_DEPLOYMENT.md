# Manual GitHub to Vercel Deployment Guide

Deploy each app separately by connecting your GitHub repo to Vercel projects.

---

## **Step 1: Push to GitHub**

First, push your code to your GitHub repository:

```bash
git add .
git commit -m "FastShip multi-app setup"
git push origin main
```

---

## **Step 2: Create Vercel Projects & Connect to GitHub**

For each app, follow these steps:

### **Create API Project:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repo `fastship`
4. Click **Import**
5. Set **Root Directory** to `apps/api`
6. Click **Deploy**
7. Wait for deployment to complete ✅

### **Create Marketing Project:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repo `fastship`
4. Click **Import**
5. Set **Root Directory** to `apps/marketing`
6. Click **Deploy**
7. Wait for deployment to complete ✅

### **Create Business Project:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repo `fastship`
4. Click **Import**
5. Set **Root Directory** to `apps/business`
6. Click **Deploy**
7. Wait for deployment to complete ✅

### **Repeat for:**
- `apps/driver`
- `apps/seller`
- `apps/admin`

---

## **Step 3: Add Environment Variables**

For each Vercel project, add the required environment variables:

### **For API Project:**
1. Go to the project → **Settings** → **Environment Variables**
2. Add these variables:

```
DATABASE_URL = your_database_url
JWT_SECRET = your_jwt_secret
ALLOWED_ORIGINS = https://marketing.vercel.app,https://business.vercel.app,...
```

### **For Frontend Projects (Marketing, Business, Driver, Seller, Admin):**
1. Go to the project → **Settings** → **Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_API_URL = https://your-api-domain.vercel.app
NEXT_PUBLIC_MARKETING_BASE_URL = https://your-marketing-domain.vercel.app
```

---

## **Step 4: Auto-Deploy When You Push**

Now whenever you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

✅ Each Vercel project automatically detects the push and re-deploys!

---

## **Workflow**

```
Your Local Machine
        ↓
   git push main
        ↓
   GitHub Repo
        ↓
Vercel Auto-Detects Changes
        ↓
┌─────────────────────────────────────────┐
│  Each project redeploys independently   │
├─────────────────────────────────────────┤
│ ✓ api.vercel.app                        │
│ ✓ marketing.vercel.app                  │
│ ✓ business.vercel.app                   │
│ ✓ driver.vercel.app                     │
│ ✓ seller.vercel.app                     │
│ ✓ admin.vercel.app                      │
└─────────────────────────────────────────┘
        ↓
✓ All apps live!
```

---

## **Verify Deployments**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click each project to see deployment status
3. View deployment logs and URLs

---

## **Troubleshooting**

### **Vercel can't find package.json**
- Make sure **Root Directory** is set correctly (e.g., `apps/api`)
- Verify `.vercelignore` files exist in each app folder

### **Build fails**
- Check **Build Command** is set to `npm run build`
- Check **Output Directory** is set to `.next`
- Verify environment variables are added

### **Deployments are creating duplicates**
- Make sure you only have ONE Vercel project per app folder
- Don't create multiple projects for the same app

---

## **Custom Domain Names**

After deployment, add custom domains:

1. Go to project → **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `api.fastship.com`)
4. Follow DNS setup instructions
5. Verify domain

---

**That's it! Now you can just use `git push` and Vercel handles the rest.** 🚀
