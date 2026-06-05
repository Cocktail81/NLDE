# 🧺 Nandlal Laundry - Data Entry System

[![Next.js](https://img.shields.io/badge/Next.js-16.2.7-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.7-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.106.2-green)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A secure laundry data-entry and reporting system for Nandlal Laundry. The app supports customer management, daily laundry entry, correction history, dynamic laundry-item reporting, CSV/PDF/print exports, and Supabase-backed authentication with server-side login rate limiting.

---

## 📋 Table of Contents

- [Features](#-features)
- [Laundry Items](#-laundry-items)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Notes](#-database-notes)
- [Security and Hardening](#-security-and-hardening)
- [Reports](#-reports)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Testing Checklist](#-testing-checklist)
- [Roadmap](#️-roadmap)
- [License](#-license)

---

## ✨ Features

### Core Features

- ✅ **Secure Login** using Supabase Auth.
- ✅ **Server-side failed-login protection** with 5 failed attempts followed by a 10-minute cooldown.
- ✅ **Customer Management** with customer search and customer creation from the entry screen.
- ✅ **Daily Entry Form** with dynamic laundry-item quantities.
- ✅ **Dry Cleaning UI Grouping** on the New Entry page to keep frequent-use items simple.
- ✅ **Duplicate Prevention** for customer/date entries.
- ✅ **Correction Workflow** with current-version tracking and correction history.
- ✅ **Dashboard Recent Entries** updated for all current laundry-item fields.
- ✅ **All Entries Page** with dynamic item columns, totals, filtering, pagination, and CSV export.

### Reporting

- 📊 **Daily Report**
- 👥 **Customer Report**
- 📅 **Date Range Report**
- 📝 **Change History Report**
- 📥 **CSV Export**
- 📄 **Professional PDF Export** using client-side `pdfmake`
- 🖨️ **Improved Browser Print Output**
- 📆 **Consistent Date Format**: `dd/mm/yyyy`
- 🕒 **Consistent Timestamp Format**: `dd/mm/yyyy, 10:23:18 AM`

### Security

- 🔐 Supabase Auth integration.
- 🛡️ Row Level Security-ready Supabase design.
- 🚦 Server-side login rate limiting through `/api/auth/login`.
- 🧾 Login attempt audit table support.
- 🔒 Security headers configured in `next.config.js`.
- 🔑 Server-only Supabase secret key usage.
- 🚫 No screenshot-based PDF export path.

---

## 🧺 Laundry Items

Laundry items are centralized through `lib/laundry-items.ts` and used across entry screens, dashboard, reports, CSV export, PDF export, and print.

Current item set:

| Key | Display Label | Short Label |
|---|---|---|
| `ironing` | Iron | Iron |
| `saree_ironing` | Saree Iron | Saree Iron |
| `gown` | Gown | Gown |
| `dhoti` | Dhoti | Dhoti |
| `coat_blazer` | Coat / Blazer | Coat / Blazer |
| `dry_cleaning` | Dry Cleaning | Dry Cleaning |
| `dress_dc` | Dress - Dry Cleaning | Dress - DC |
| `gown_dc` | Gown - Dry Cleaning | Gown - DC |
| `coat_blazer_dc` | Coat / Blazer - Dry Cleaning | Coat / Blazer - DC |

The New Entry page keeps Dry Cleaning fields collapsed by default:

- Dry Cleaning
- Dress - Dry Cleaning
- Gown - Dry Cleaning
- Coat / Blazer - Dry Cleaning

The Correction page intentionally keeps all fields visible for full correction visibility.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.2.7 |
| UI | React 19.2.7 |
| Language | TypeScript 5.8.3 |
| Styling | Tailwind CSS 3.4.17 |
| Backend/Auth/Database | Supabase |
| Supabase Client | `@supabase/supabase-js`, `@supabase/ssr` |
| PDF Reports | `pdfmake` |
| Icons | `lucide-react` |
| Deployment Target | Vercel |
| Runtime | Node.js 20.9+ |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=20.9.0`
- npm
- Supabase project
- Vercel account for deployment

### Installation

```bash
git clone <your-repository-url>
cd nlde-app
npm install
```

### Local Development

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

For LAN testing, use your local network IP, for example:

```txt
http://192.168.20.10:3000
```

---

## 🔐 Environment Variables

Create a local `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

Important:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe for browser use.
- `SUPABASE_SECRET_KEY` is server-only and must never be exposed to client code.
- Add the same variables in Vercel Project Settings for Production and Preview environments as needed.

---

## 🗄️ Database Notes

The app uses Supabase/PostgreSQL with RLS-enabled tables.

Core tables include:

- `customers`
- `entries`
- `user_profiles`
- `login_attempts`

Important data model notes:

- Entries use `is_current_version` for current/correction tracking.
- Historical correction rows are retained.
- Only one current entry should exist per customer/date.
- All laundry item quantity columns should default to `0` and be non-null.
- `login_attempts` should be inaccessible to browser users and accessed only by the service role from server code.

Recommended `login_attempts` access model:

- RLS enabled.
- No access for `anon`.
- No access for `authenticated`.
- Service role only.

---

## 🔒 Security and Hardening

### Login Hardening

The login page posts credentials to:

```txt
/api/auth/login
```

The server-side route enforces:

- Safe JSON parsing.
- Email format validation.
- Server-side failed-attempt tracking.
- 5 failed attempts.
- 10-minute cooldown.
- Login attempt audit writes.
- Generic safe error handling.

The UI also includes:

- Disabled Sign In button until email/password are entered.
- Password show/hide button.
- Lockout countdown display.

### Security Headers

Security headers are configured in `next.config.js` through `headers()`.

Configured headers include:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-DNS-Prefetch-Control`
- `Strict-Transport-Security` in production mode

The CSP allows:

- Self-hosted app assets.
- Supabase HTTP/WebSocket connections.
- Local development origins.
- LAN development origin.
- Cloudflare tunnel development origin when configured.

### API Route Audit

Current API routes reviewed:

- `app/api/auth/login/route.ts`
- `app/api/auth/callback/route.ts`

Hardening applied:

- Auth callback uses the server Supabase client.
- Auth callback handles exchange errors safely.
- Login route has server-side validation and rate limiting.
- Audit insert/delete errors are checked.
- Server-only admin client is isolated under `lib/supabase/admin.ts`.

---

## 📊 Reports

Reports use centralized laundry item metadata and support all current item columns.

### Available Reports

- Daily Report
- Customer Report
- Date Range Report
- Change History Report

### Export Formats

| Format | Status |
|---|---|
| On-screen report | Supported |
| CSV | Supported |
| PDF | Supported through client-side `pdfmake` |
| Browser print | Supported with improved print helper |

### PDF Notes

PDF reports are generated from structured report data using `pdfmake`. They are not screenshots.

Benefits:

- Sharper text.
- Selectable/searchable PDF content.
- Better table layout.
- Better page handling.
- Professional report formatting.

### Print Notes

Browser print uses `lib/printUtils.ts` and supports:

- A4 landscape orientation.
- Compact mode for Change History.
- Repeated table headers.
- Better page-break behavior.
- Consistent report headers and timestamps.

---

## 📁 Project Structure

```txt
app/
  api/
    auth/
      callback/
        route.ts
      login/
        route.ts
  dashboard/
    page.tsx
  entries/
    page.tsx
    new/
      page.tsx
    [id]/
      correct/
        page.tsx
  login/
    page.tsx
  reports/
    page.tsx
    components/
    types/
    utils/

components/
  CustomerAutocomplete.tsx
  layout/
  ui/

lib/
  auth.ts
  laundry-items.ts
  pdf/
    report-pdf.ts
  printUtils.ts
  supabase/
    admin.ts
    client.ts
    server.ts

proxy.ts
next.config.js
```

---

## 🧪 Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
npm run type-check
```

Recommended pre-deployment check:

```bash
npm run type-check
npm run lint
npm run build
```

---

## 🚢 Deployment

The app is prepared for Vercel deployment.

Deployment checklist:

1. Push code to GitHub.
2. Import the project into Vercel.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
4. Deploy.
5. Verify security headers in browser DevTools.
6. Test login, reports, PDF export, print, and rate limiting.

Note: `output: 'standalone'` is not required for Vercel deployment and should remain removed unless self-hosting.

---

## ✅ Testing Checklist

Before production use, verify:

### Authentication

- Valid login redirects to dashboard.
- Invalid password shows remaining attempts.
- 5 failed attempts trigger 10-minute cooldown.
- Refresh does not bypass cooldown.
- Callback route redirects correctly.

### Entry Flow

- New entry saves correctly.
- Duplicate customer/date entries are blocked.
- Dry Cleaning section expands/collapses on New Entry page.
- Correction page shows all fields.
- Correction history displays correctly.

### Reports

- Daily Report works.
- Customer Report works.
- Date Range Report works.
- Change History Report works.
- CSV export uses `dd/mm/yyyy`.
- PDF export uses `dd/mm/yyyy`.
- Print uses `dd/mm/yyyy`.
- Generated timestamp uses `dd/mm/yyyy, 10:23:18 AM`.

### Deployment

- Vercel environment variables are set.
- Supabase Auth redirect URLs are configured.
- CSP does not block required production resources.
- Response headers are present in production.

---

## 🗺️ Roadmap

Potential future improvements:

- Supabase Auth dashboard hardening review:
  - password strength
  - leaked password protection
  - email confirmation/recovery settings
  - CAPTCHA/Turnstile if needed
- RLS verification pass.
- Admin user management UI.
- Dashboard charts and analytics.
- Bulk entry mode.
- Database backup/export workflow.
- More granular audit logging.
- Optional direct “Open Existing Entry” action from duplicate-entry warning.

---

## 📄 License

Distributed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [pdfmake](https://pdfmake.github.io/docs/)
- [Vercel](https://vercel.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 📧 Support

For internal support, contact the project maintainer.

---

Built with care for **Nandlal Laundry**.

Last Updated: June 2026  
Version: 2.0.0
