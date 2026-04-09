# Navigate La Salle
# CHANGELOG

## V0.1 — 09/04/2026
### Backend
- Initialized Express server with ES Modules
- Connected MongoDB Atlas via Mongoose
- Configured dotenv, cookie-parser, nodemon
- Implemented JWT authentication via httpOnly cookies
- Built authRoutes.js:
  - POST /api/auth/login
  - GET /api/auth/me
  - POST /api/auth/forgot-password
  - GET /api/auth/reset-password/:token
  - POST /api/auth/reset-password/:token
  - POST /api/auth/logout
- Built accountRoutes.js:
  - GET /api/accounts
  - POST /api/accounts/invite
  - DELETE /api/accounts/:id
- Added verifyToken middleware with API/page-aware responses
- Integrated Brevo (sib-api-v3-sdk) for transactional emails
  - Reset password email (template ID 3)
  - Invite email (template ID 4)
- Models: Admin.js, Invite.js
### Frontend — Admin Auth Pages
- login.html — login form with error handling, loading overlay, redirect if already logged in
- forgot-password.html — sends reset email, success modal, loading overlay
- reset-password.html — token validation on load, expired token modal, password rules validation on blur, confirm password check, button disabled until valid, success modal, loading overlay
### Frontend — Admin Pages
- sidebar.html — full sidebar with nav, admin footer, logout modal, inactivity modal (UI only)
- sidebar.js — auth check, sidebar loader, admin info population, active link highlight, collapse toggle with localStorage persistence, logout flow
- dashboard.html — layout only
- accounts.html — full accounts management page:
  - Dynamic table population from API
  - Last login formatting (Today / X days ago / X weeks ago / X months ago / YYYY/MM/DD)
  - Email truncation for non-superadmin viewers
  - Invite button visible to superadmin only
  - Delete button hidden for superadmin rows
  - Delete confirmation modal with target name
  - Invite modal with pending/existing account checks
  - Search filtering
  - Pagination
  - Loading overlay on all fetch operations
  - Toast notifications for success/error
### Shared
- loading.html + loading.css + loading.js — global loading overlay system
- toast.js + toast.css — global toast notification system