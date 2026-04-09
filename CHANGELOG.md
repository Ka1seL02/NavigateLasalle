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

## V0.2 — 10/04/2026
### Frontend — Sidebar
- Added dark mode / light mode theme toggle switch in sidebar
- Theme persists across all pages via localStorage
- Icon switches between moon (light) and sun (dark)
- Label reflects current mode (Dark Mode / Light Mode)
- Toggle switch stays visible when sidebar is collapsed, icon and label hide
### Frontend — Shared
- Added dark mode CSS variables to root.css via [data-theme="dark"] selector
### Backend
- Added FAQ.js model (question, answer, isVisible, unique question constraint)
- Added faqRoutes.js:
  - GET /api/faq — fetch all FAQs
  - POST /api/faq — create new FAQ
  - PATCH /api/faq/:id — update question, answer, and/or visibility
  - DELETE /api/faq/:id — delete FAQ
- Wired faqRoutes in server.js
### Frontend — FAQ Page
- faq.html — FAQ management page layout
- faq.js — dynamic population of FAQ list with:
  - Collapse/expand per FAQ item with chevron rotation
  - Inline editing — question input and answer textarea
  - Textarea auto-height on edit entry
  - Edit button becomes save during edit mode
  - Only save and cancel visible during editing
  - Cancel restores original values
  - Save calls PATCH with toast feedback for success and errors
  - Visibility toggle with correct bx-show/bx-hide icon reflecting isVisible
  - Loading overlay on all fetch operations
  - Toast notifications for success/error