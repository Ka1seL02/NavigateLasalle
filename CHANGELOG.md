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