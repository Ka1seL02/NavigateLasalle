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
### Frontend - Admin Accounts
- `a_accounts.html` — accounts page layout with page title, count badge, search bar, invite button, accounts table with pagination controls
- Table columns — name, email, role badge, last login, actions
- Role badges styled differently for superadmin and admin
- Invite button hidden by default, shown only for superadmin via JS
- Pagination controls — showing x-y out of total, page input (no spin buttons), prev/next buttons with disabled state
- Delete button with red hover effect
- Last login shown as tooltip on hover instead of full column
### Backend
- Added `role` field to Admin model with enum `superadmin` and `admin`, default `admin`
- Added `lastLogin` field to Admin model, updated on every successful login
- Added `/api/auth/me` route — returns current admin name, email, role from JWT cookie
- Added `/api/auth/logout` route — clears httpOnly cookie
- Added `cookie-parser` middleware to read httpOnly cookies
- Updated login route — JWT and cookie now expire in 15 minutes, updates lastLogin on login
- Updated seed to include `role: superadmin` for first admin, added 10 additional test admin accounts
- Created `server/middleware/requireSuperAdmin.js` — middleware to protect superadmin-only routes