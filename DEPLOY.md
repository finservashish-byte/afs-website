# AFS Hugo — Deployment Guide
**Version:** Phase 3 + Phase 4A Integrated  
**Date:** May 2025

---

## What's in this build

| Phase | Status | What's included |
|-------|--------|-----------------|
| Phase 2 | ✅ Live | Hugo + Decap CMS, all pages, blog, calculators |
| Phase 3 | ✅ Integrated | Liquid Glass CSS (`phase3.css`) + Animation JS (`phase3.js`) |
| Phase 4A | ✅ Integrated | AFS Wealth Lens tool at `/tools/wealth-lens/` |

---

## Quick Deploy to Netlify

### First-time setup
```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/afs-website.git
cd afs-website

# Copy this build into the repo
cp -r /path/to/afs-hugo/* .

# Set up Hugo (macOS)
brew install hugo
hugo version  # Confirm >= 0.124.1
```

### Push to trigger Netlify auto-deploy
See Git Commands section below.

---

## Git Commands (exact, copy-paste ready)

### 1. Navigate to your repo
```bash
cd ~/afs-website   # or wherever your repo is
```

### 2. Stage all changes
```bash
git add -A
```

### 3. Commit with a descriptive message
```bash
git commit -m "feat: Phase 3 Liquid Glass + Phase 4A AFS Wealth Lens

- Integrated afs-phase3.css into Hugo Pipes CSS bundle
- Integrated afs-phase3.js into Hugo Pipes JS bundle  
- Updated navbar to afs-nav Phase 3 class structure
- Added scroll animations (IntersectionObserver) on hero, services, testimonials, tools
- Updated CSP in netlify.toml for PDF.js (cdnjs.cloudflare.com)
- Added AFS Wealth Lens layout: layouts/tools/wealth-lens.html
- Added content file: content/tools/wealth-lens.md (URL: /tools/wealth-lens/)
- Added Wealth Lens hero card on homepage tools section
- Added Wealth Lens link in desktop nav and mobile drawer"
```

### 4. Push to main branch
```bash
git push origin main
```

### 5. Confirm Netlify auto-deploy
Netlify watches your `main` branch. After the push:
1. Go to https://app.netlify.com → Your site → **Deploys**
2. You'll see a new deploy triggered automatically
3. Build command: `hugo --minify` (set in netlify.toml)
4. Publish directory: `public`
5. Deploy typically takes 60–90 seconds

### 6. Verify live URLs after deploy
- Homepage: https://ashishfinancialservices.in/
- Wealth Lens: https://ashishfinancialservices.in/tools/wealth-lens/
- Tools hub: https://ashishfinancialservices.in/tools/

---

## Local development
```bash
hugo server -D
# Open: http://localhost:1313
```

---

## Hugo Pipes asset pipeline

All CSS and JS are now bundled via Hugo Pipes:

**CSS bundle** (`css/afs-bundle.css`):
- `assets/css/main.css` — Phase 2 base styles
- `assets/css/phase3.css` — Liquid Glass UI + animations

**JS bundle** (`js/afs-bundle.js`):
- `assets/js/main.js` — core interactions
- `assets/js/calculators.js` — calculator logic
- `assets/js/phase3.js` — IntersectionObserver animations, nav glass behaviour, card tilt, stat counters, swipe, FAB

Both bundles are minified + fingerprinted for cache-busting.

**Wealth Lens exceptions** (loaded only on `/tools/wealth-lens/`):
- `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` — PDF parser (external, cdnjs)
- Inline `<style>` — scoped tool CSS (injected via `head-extra` block)
- Inline `<script>` — all tool JS (injected via `scripts` block)

---

## Decap CMS
Access at: https://ashishfinancialservices.in/admin/  
Requires Netlify Identity to be enabled on your Netlify site.

