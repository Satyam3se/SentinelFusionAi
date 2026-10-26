# SentinelFusion AI — Free Deployment & Prototype Submission Guide

---

## 🚀 1. Immediate Live Public Link (Active Right Now!)

Aapka prototype abhi internet par live chal raha hai:

> **🔗 Live Prototype URL:** `https://f03058a285ae70.lhr.life`
> *(SSL Encrypted HTTPS, Zero Config, Fully Functional Full-Stack Prototype)*

### 🔑 Demo Login Credentials (Judges ke liye)

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Review Officer (Recommended)** | `reviewer` | `SentinelReviewerDemo#2026` | Tactical Radar Scope, AI COA Authorization, Review Decisions |
| **Intelligence Analyst** | `analyst` | `SentinelAnalystDemo#2026` | Correlation Graphs, SITREP Generation, Sensor Health |
| **Mission Administrator** | `admin` | `SentinelAdminDemo#2026` | Simulation Lab (10 Scenarios), User Admin, Security Center |
| **Field Observer** | `observer` | `SentinelObserverDemo#2026` | Read-only Tactical Tracking & Incidents Feed |

---

## 🌐 2. Permanent 24/7 Cloud Hosting (For Long-Term Submission)

Humne already ye configuration files create kar di hain:
- `render.yaml` — Render.com 1-Click Free Web Service Blueprint
- `Dockerfile` — Universal container build (Hugging Face Spaces / Koyeb / Fly.io)
- `package.json` — Monorepo cloud build runner
- `Procfile` — Cloud web process runner

### Option A: Render.com (100% Free Web Service — Easiest & Best)
1. **GitHub par Repo Banayein**:
   - [github.com/new](https://github.com/new) par jayein aur ek nayi repository banayein: `sentinelfusion-ai`
   - Terminal me ye 2 commands chalayein:
     ```bash
     git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/sentinelfusion-ai.git
     git push -u origin main
     ```
2. **Render.com par 1-Click Deploy**:
   - [dashboard.render.com](https://dashboard.render.com) par free sign up karein (GitHub se login karein).
   - Click **"New +"** -> **"Web Service"**
   - Apni `sentinelfusion-ai` repo select karein.
   - Render automatically `render.yaml` detect kar lega:
     - **Build Command**: `npm run build && cd backend && pip install -r requirements.txt`
     - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - **Plan**: Free ($0/month)
   - Click **"Deploy Web Service"**
   - 2-3 minutes me aapko permanent link mil jayega: `https://sentinelfusion-ai.onrender.com`

---

### Option B: Hugging Face Spaces (100% Free Forever — No Credit Card Needed)
1. [huggingface.co](https://huggingface.co) par free account banayein.
2. Click **"New Space"** -> Space Name: `sentinelfusion-ai` -> SDK: **Docker**.
3. Apni code repo push karein ya GitHub se connect karein.
4. Hugging Face hamare `Dockerfile` ko automatically build karke permanent URL de dega:
   `https://huggingface.co/spaces/<YOUR_USERNAME>/sentinelfusion-ai`

---

## ⚡ 3. Anytime 1-Click Live Tunnel (Your Computer)

Aapke project root folder me **`SHARE_LIVE_LINK.bat`** file bana di gayi hai:
- Jab bhi aap judges ko live demo dikhana chahein:
  1. `START_SYSTEM.bat` chalao (Backend + Frontend live ho jayenge).
  2. `SHARE_LIVE_LINK.bat` par double-click karo.
  3. Terminal par **`https://....lhr.life`** link aayega — use copy karke judges ko bhej do!
