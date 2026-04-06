# Navigate La Salle Changelog

## [v0.1] - 00:34 2026-04-05
### Project Setup
- Initialized backend with Node.js and ES modules (`"type": "module"`)
- Set up Express server (`server/server.js`)
- Configured environment variables (`.env`)
- Connected MongoDB Atlas (`server/config/db.js`)
- Loaded dotenv before all imports via (`server/config/env.js`)
- Served frontend as static files via Express
- Added CORS with credentials support
### Admin
- Created Admin model with fields: name, email, password, resetPasswordToken, resetPasswordExpires (`server/models/Admin.js`)
- Created seed file to insert first admin account with hashed password (`server/utils/seed.js`)
### Authentication Routes (`server/routes/authRoutes.js`)
- Forgot password route with timing attack prevention
- Silent cooldown — skips sending if token still valid without revealing account existence
- Reset tokens are hashed with SHA-256 before storing in DB
- Reset tokens expire in 15 minutes
- Reset password route that verifies hashed token and expiry
- Clears token after successful reset
- Verify reset token route to validate token on page load
- Login route with bcrypt password comparison
- JWT token stored in httpOnly cookie on successful login
- Cookie set to secure in production, insecure in development
### Email (`server/utils/emailService.js`)
- Integrated Brevo (sib-api-v3-sdk) for transactional emails
- `sendResetEmail` function using Brevo template #3
### Frontend - Admin
- `a_login.html` — split layout, left form right image, dismissable error message
- `a_forgot-password.html` — email input, sends reset link, success modal, redirects to login on close
- `a_reset-password.html` — new password + confirm password, password rules validation on blur, success modal, redirects to login on close
- Token verification on page load — redirects to login if token is missing, invalid, or expired
- Password rules turn red on blur if requirements not met

## [v0.2] - 00:29 2026-04-06
### Frontend - Admin Dashboard
- `a_dashboard.html` — dashboard layout with sidebar container and main content area
- `a_sidebar.html` — reusable sidebar component loaded dynamically via fetch, includes logout modal and inactivity modal
- `a_sidebar.js` — loads sidebar into any admin page, sets active nav link based on current URL, handles collapse toggle, logout modal, inactivity modal ok button
- `a_sidebar.css` — sidebar styles with collapsed state, nav labels, admin footer, logout modal, inactivity modal
- `a_dashboard.css` — base dashboard layout with flexbox
- `a_auth.js` — reusable auth check, redirects to login if not authenticated, starts 15min inactivity watcher, auto logout on inactivity with modal notification
- Added `type="module"` to script tags for ES module support
### Backend
- Added `role` field to Admin model with enum `superadmin` and `admin`, default `admin`
- Added `lastLogin` field to Admin model, updated on every successful login
- Added `/api/auth/me` route — returns current admin name, email, role from JWT cookie
- Added `/api/auth/logout` route — clears httpOnly cookie
- Added `cookie-parser` middleware to read httpOnly cookies
- Updated login route — JWT and cookie now expire in 15 minutes, updates lastLogin on login
- Updated seed to include `role: superadmin` for first admin, added 10 additional test admin accounts
- Created `server/middleware/requireSuperAdmin.js` — middleware to protect superadmin-only routes

## [v0.3] 18:49 2026-04-07
### Frontend - Admin Accounts
- `a_accounts.html` — finalized layout with page title, count badge, toolbar, table, pagination and modals
- `a_accounts.css` — full styling for toolbar, table, last login badges, pagination, modals
- `a_accounts.js` — full implementation with fetch and render table, email masking based on role, delete buttons visible only to superadmin, search filtering, pagination, invite modal, delete confirmation modal, toast notifications, table refresh after delete
- Added shared modal overlay with invite and delete confirmation modals inside
- Invite modal — email input side by side with send button, X close button
- Delete confirmation modal — dynamic name display via `id="deleteTargetName"`
- Last login display with `fresh` (green, today) and `stale` (grey, older) badge styles
### Frontend - Admin Register
- `a_register.html` — create account page with name, email (disabled/prefilled), password, confirm password fields
- `a_register.js` — token verification on load, redirects to login if no token/invalid/expired, pre-fills email from invite token, password rules validation on blur, border turns red on mismatch/invalid password, success modal redirects to login, redirects to login on any backend error
### Frontend - Admin Toast
- `a_toast.js` — reusable toast notification utility, supports success and error types, auto dismisses after 4 seconds, manual close button, slides in from top right
- `a_toast.css` — toast styles with left color border, slide in/out animation, success green and error red variants
### Backend
- Added `role` field to Admin model with enum `superadmin` and `admin`, default `admin`
- Added `lastLogin` field to Admin model, updated on every successful login
- Added `Invite` model with email, hashed invite token, expiry (24 hours)
- Added `/api/invite/send` route — superadmin only, checks if email exists in admins or has pending invite, generates hashed token, sends Brevo template #4
- Added `/api/invite/verify` route — verifies invite token, returns email if valid
- Added `/api/auth/register` route — verifies invite token against Invite collection, creates admin account with email from invite, deletes invite after success
- Added `/api/auth/admins` GET route — returns all admins with email masking based on requester role
- Added `/api/auth/admins/:id` DELETE route — superadmin only, prevents deleting own account or another superadmin
- Added `requireSuperAdmin` middleware — checks JWT cookie and verifies role is superadmin, returns 403 if not
- Added `rateLimiter.js` middleware — login (5 attempts/15min), forgot password (3 attempts/15min), invite (10 attempts/15min)
- Added `sendInviteEmail` function to `emailService.js` using Brevo template #4
- Added `inviteRoutes.js` registered at `/api/invite`
- Installed `express-rate-limit` and `cookie-parser` packages