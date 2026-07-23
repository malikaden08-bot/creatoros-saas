# CreatorOS - Enterprise AI-Powered SaaS Operating System

CreatorOS is a world-class AI-powered SaaS platform for creators, media teams, agencies, and social media managers. It combines AI content generation, professional video editing, photo editing, subtitle generation, visual n8n workflow automation, multi-channel social publishing, performance analytics, ecosystem marketplace, and enterprise administration into one unified operating system.

---

## 🌟 Key Modules & Features

- **AI Studio Suite (23 Tools)**: Conversational Assistant, Text-to-Image, Text-to-Video, Image-to-Video, Logo Generator, Thumbnail Generator, Avatar Generator, Voice Clone (TTS), Music Generator, Script Writer, Blog Writer, Email Writer, SEO Writer, Caption Generator, Hashtag Generator, Carousel Writer, Prompt Library, GPU Queue Manager, Export System.
- **Pro Browser Video Editor**: Timeline, multi-track video editing, keyframes, speed control, auto subtitles, kinetic caption presets, transitions, and filters.
- **Pro Browser Image Editor**: Layers, mask selection, brush, AI background removal, magic eraser, and filter color grading.
- **Visual Automation Workflows (n8n Engine)**: 2D infinite canvas, SVG Bezier curve connections, trigger suites, control flow nodes, test execution, debug logs drawer, and template marketplace.
- **Social Media Publisher (8 Networks)**: Cross-posting to Instagram, Facebook, TikTok, YouTube, LinkedIn, Pinterest, Threads, and X (Twitter) with interactive content calendar, AI captions, AI hashtags, and bulk CSV scheduler.
- **Performance Analytics Dashboard**: Executive KPI cards, audience growth charts, monetization revenue breakdown, 7x24 best-time-to-post heatmap, top posts leaderboard, AI insights, and custom PDF/CSV report builder.
- **CreatorOS Ecosystem Marketplace**: 12 asset categories (Templates, AI Agents, Workflows, Plugins, Video Packs, Transitions, LUTs, Fonts, Icons, Prompt Packs, Themes), star ratings, reviews, 1-click installations, and installed assets manager.
- **Enterprise Admin Command Center**: User directory, RBAC role permissions, subscriptions & MRR ledger, API keys, canary feature flags, support helpdesk, security audit logs, database connection pool gauges, S3 storage meters, and AI API token spend tracking.
- **Production Readiness**: Docker multi-stage build, Security HTTP headers (`CSP`, `HSTS`), `/api/health` REST endpoint, dynamic `sitemap.xml`, `robots.txt`, `manifest.json`, Global Error Boundary, CI/CD GitHub Actions workflow, `.env.example`, and OpenAPI 3.0 API Documentation.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Local Setup
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open browser at http://localhost:3000
```

### Production Build & Docker Setup
```bash
# Build standalone bundle
npm run build

# Build Docker image
docker build -t creatoros/app:latest .

# Run Docker container
docker run -p 3000:3000 creatoros/app:latest
```

---

## 📄 License
MIT License. Created for Creators, Agencies, and SaaS Builders worldwide.
