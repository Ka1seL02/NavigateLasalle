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

## V0.3 — 10/04/2026
### Frontend — Sidebar (Revamp)
- Removed collapse toggle entirely — sidebar is now fixed width (80px)
- Removed admin name/role display from sidebar
- New dark green vertical icon-based sidebar design
- Icons with labels below each, subtle dividers between sections
- Theme toggle becomes clickable icon in footer (moon/sun)
- Sign Out button at bottom with icon and label
- Modals updated to match new design language (blur backdrop, EB Garamond headings)
### Frontend — Auth Pages Redesign
- login.css — full redesign: fluid layout, EB Garamond headings, Noto Sans body,
  staggered entrance animations, green glow on input focus, lift effect on button,
  image section with green gradient overlay and brand name, responsive breakpoints
- forgot-password.css — matching redesign consistent with login, backdrop blur modal,
  back link with sage-green hover, column-reverse on mobile
- reset-password.css — matching redesign, password rules styled as card,
  disabled button handled via CSS :disabled pseudo-class
- register.css — matching redesign, readonly email field styled, expired modal
### Frontend — Accounts Page
- accounts.css — full redesign: dirty-white background, white card main-content,
  Noto Sans typography, sticky table headers, no row dividers with hover highlight,
  role badges differentiated (superadmin gets border)
- Added "you" badge on current logged-in user's row
- Fixed table stretching on large screens
- Fixed main-content card height via align-items: flex-start on main
### Frontend — FAQ Page
- faq.css — full redesign matching design language
- faq.html — added Create FAQ modal with floating label inputs and Delete FAQ modal
- faq.js — wired up create and delete:
  - Create FAQ with POST /api/faq, toast feedback, refetch on success
  - Delete FAQ with DELETE /api/faq/:id, confirmation modal, toast feedback
  - Fixed double deleteBtn declaration bug
  - Fixed openDeleteFaqModal scope issue
  - Smooth collapse/expand animation via max-height transition
## V0.4 — 11/04/2026
### Backend
- Added cloudinary.js config
- Added upload.js middleware with multer-storage-cloudinary:
  - Subfolders per resource type (buildings/, offices/, news/)
  - quality: auto and fetch_format: auto for automatic compression
  - 10MB file size limit with proper error handling
- Added Building.js model:
  - Fields: name, dataId (unique), category, description, images, isVisible, shape
  - Shape supports rect (x,y,width,height,rotate,rx,ry) and ellipse (cx,cy,rx,ry)
  - isVisible repurposed as Open/Under Maintenance toggle
- Added buildingRoutes.js:
  - GET /api/buildings — fetch all sorted by category then name
  - GET /api/buildings/:id — fetch one
  - POST /api/buildings — create with Cloudinary image upload
  - PATCH /api/buildings/:id — update, handles image removal from Cloudinary
  - DELETE /api/buildings/:id — delete from DB and Cloudinary
- Added seedBuildings.js — seeds all 57 map elements from SVG campus map
### Frontend — Building Page
- building.html — list + map view with tab toggle
- building.css — cards grouped by category, map SVG view, view modal with gallery
- building.js:
  - List view — cards grouped by category with image/placeholder
  - Map view — SVG rendered from DB shape data, clickable elements
  - View modal — image carousel with auto-swap (3s), dot navigation resets timer,
    scrollable without scrollbar, centered content
  - Delete modal — confirms before delete
  - Remembers list/map view when returning from edit via URL param
### Frontend — Building Edit Page
- building-edit.html — prefilled form with all building fields
- building-edit.css — two-column layout, image management
- building-edit.js:
  - Fetches building by ID from URL param, redirects if not found
  - Quill.js rich text editor for description
  - Existing images shown with X to remove (deletes from Cloudinary on save)
  - New image upload with preview and individual removal
  - Visibility toggle labeled Open / Under Maintenance
  - Empty Quill saves as null not HTML empty state
  - Cancel and save return to correct list/map view via URL param
### Frontend — Building Add Page
- building-add.html — two-step flow
- building-add.css — step cards, map editor, form layouts
- building-add.js:
  - Step 1: Map editor — choose shape type (rect/ellipse), set dimensions,
    drag to position on SVG map, real-time position display, confirm position
  - Step 2: Building info form — name, dataId, category, status, description, images
  - Existing buildings shown as faded reference on map
  - Back to map button returns to Step 1

## V0.5 — 11/04/2026
### Backend
- Added `road` as a valid category in `Building.js` model enum
- Added `seedRoads.js` — seeds 28 campus roads into the buildings collection:
  - All named roads, trails, and rotundas from the campus SVG map
  - Skips existing entries (safe to re-run, no deleteMany)
- Added `MapGraph.js` model:
  - Single document collection storing the full campus navigation graph
  - Nodes: id, x, y, buildingId (stores Building `_id`, null if road waypoint)
  - Edges: from, to, weight (auto-calculated Euclidean distance), type (both/one-way), direction (from→to / to→from)
- Added `mapGraphRoutes.js`:
  - `GET /api/mapgraph` — fetch graph (public, kiosk will need it later)
  - `PUT /api/mapgraph` — save entire graph, replaces existing (protected)
  - Validates edge node references exist
  - Enforces max 10 edges per node
- Added `Office.js` model:
  - Fields: name, category (free text String, no enum), head, description (Quill HTML), email, phone, officeHours, images (Cloudinary), personnel ([{role, name}]), subOffices ([ObjectId ref Office]), building (ObjectId ref Building), isVisible
  - category is dynamic — managed from frontend, not hardcoded in model
- Added `officeRoutes.js`:
  - `GET /api/offices` — get all, supports `?building=id` query filter for fetching offices by building
  - `GET /api/offices/:id` — get one
  - `POST /api/offices` — create with uploadOffice image upload
  - `PATCH /api/offices/:id` — update, handles image removal from Cloudinary
  - `DELETE /api/offices/:id` — deletes from DB, Cloudinary, and removes from any parent subOffices arrays
- Wired `/api/mapgraph` and `/api/offices` into `server.js`
### Frontend — Building Page (Updated)
- `building.html`:
  - Added Graph tab alongside List and Map
  - Map view legend added below canvas (building types + scroll/pan hint)
  - View modal now shows "Offices in this Building" section (read-only, fetched from `/api/offices?building=id`, hidden if none)
- `building.css`:
  - Added Graph view styles: toolbar, ghost buildings, node styles, edge styles, grid, road preview, legend
  - Added map legend styles
  - Added modal offices section styles
  - Updated map building colors to pastel palette, road color muted
  - Added drop-shadow to buildings, facilities, gates, landmarks for subtle 3D depth
- `building.js`:
  - Splits fetched data into `allBuildings` (non-road) and `allRoads` (category: road)
  - Roads now fetched from DB dynamically — no hardcoded road data
  - Map view renders roads from DB as non-interactive background layer before buildings
  - Map view: zoom (scroll) and pan (Alt+drag) via `initZoomPan()`
  - Graph view — full graph editor:
    - Node mode: click empty space to place node, click+drag existing node to reposition, hover shows live map coordinates, placed node shows x/y coordinates
    - Edge mode: click node A then node B to connect, auto-calculates Euclidean weight, supports chaining, enforces 10-edge limit, blocks duplicate edges
    - Assign mode: click node then click faded building ghost to assign — stores Building `_id` not dataId, node label displays dataId via lookup
    - Delete mode: click node to remove it and all its edges, click edge line to remove just that edge, click road shape to delete road from DB
    - Road mode: fill in road name and ID, click and drag to draw new rect road segment, saves to DB via POST /api/buildings
    - Grid overlay (40px squares) for node placement alignment
    - Loads existing graph from backend on first tab open
    - Save Graph button PUTs full graph state to /api/mapgraph
    - Edge direction toggle (Two-way / One-way) shown only in Edge mode
    - One-way edges render dashed with arrowhead marker
    - Ghost buildings show assigned state (green stroke) when linked to a node
- `building-add.js`:
  - Added zoom/pan via `initZoomPan()` — scroll to zoom, Alt+drag to pan
  - getSVGCoords replaced with version returned by initZoomPan
  - Overlap detection on Confirm Position — checks new shape bounding box against all existing non-road buildings, blocks if overlapping
  - Roads rendered as muted grey reference layer on add map
### Frontend — Office Pages (New)
- `offices.html` + `office.css` + `office.js`:
  - Card grid grouped by section/category with search filter (name, category, head)
  - View modal: gallery with auto-swap carousel, section badge, visibility badge (orange if under maintenance), name, head, contact info pills (email/phone/hours), Quill description, personnel list, sub-offices list, building reference
  - Delete modal with confirmation — also cleans up subOffices references in parent offices
- `office-add.html` + `office-add.css` + `office-add.js`:
  - Straight form, no map editor (offices have no SVG shape)
  - Dynamic section dropdown: unique categories fetched from DB + always includes "Unaffiliated" + "+ Create New Section" option which reveals a text input
  - Building dropdown populated from DB (roads excluded)
  - Sub-offices: searchable dropdown, selected offices shown as removable green tags
  - Personnel: add/remove rows with role and name inputs
  - Back/cancel navigate to `office.html`
- `office-edit.html` + `office-edit.css` + `office-edit.js`:
  - Same layout as office-add, prefills all fields from DB
  - Existing images shown with X to mark for removal (toggle, click again to undo)
  - Dynamic section dropdown handles custom categories not in existing list
  - Sub-office dropdown excludes the office being edited (cannot add itself)
  - Back/cancel navigate to `office.html`

## V0.6 — 11/04/2026
### Backend
- Added `Post.js` model:
  - Fields: title, content (Quill HTML), type (enum: news/announcement/event), office (ObjectId ref Office, null = DLSU-D campus-wide), images ([String], min 1 required), createdAt/updatedAt (auto timestamps)
  - No isVisible field
- Added `postRoutes.js`:
  - `GET /api/posts` — fetch all, public (kiosk needs it), supports `?type=` and `?office=` query filters, populates office name and category
  - `GET /api/posts/:id` — fetch one, public
  - `POST /api/posts` — create with uploadNews image upload, enforces min 1 image (protected)
  - `PATCH /api/posts/:id` — update, handles image removal from Cloudinary, enforces min 1 image remaining (protected)
  - `DELETE /api/posts/:id` — deletes from DB and Cloudinary (protected)
  - Wired `/api/posts` into `server.js`
- Added `Feedback.js` model:
  - Fields: rating (Number, 1-5, required), comment (String, optional, default null), isRead (Boolean, default false), createdAt/updatedAt (auto timestamps)
- Added `feedbackRoutes.js`:
  - `GET /api/feedbacks` — fetch all, sorted newest first, supports `?isRead=true|false` filter (protected)
  - `POST /api/feedbacks` — create, public (kiosk submits feedback)
  - `PATCH /api/feedbacks/:id/read` — mark as read (protected)
  - `DELETE /api/feedbacks/:id` — delete (protected)
  - Wired `/api/feedbacks` into `server.js`
- Added `seedFeedbacks.js` — seeds 10 sample feedbacks (mix of read/unread, with/without comments, varied ratings, safe to re-run via duplicate check)
- Updated `accountRoutes.js`:
  - `PATCH /api/accounts/me` — update own name only (email removed from this route)
  - `POST /api/accounts/me/email-change` — generates 6-digit code, saves to Admin doc with 3-minute expiry, sends code to current email via Brevo Template ID 5
  - `PATCH /api/accounts/me/email-change/verify` — verifies code, applies new email, clears code fields
  - `PATCH /api/accounts/me/password` — change password with current password verification
- Updated `Admin.js` model:
  - Added `emailChangeCode` (String, default null)
  - Added `emailChangeExpires` (Date, default null)
  - Added `emailChangePending` (String, default null)
- Updated `emailService.js`:
  - Added `sendEmailChangeCode` — sends Brevo Template ID 5 with params: FIRSTNAME, CODE, EXPIRES_IN
- Added Brevo Template ID 5 — Email Change Verification:
  - Subject: "Email Change Verification"
  - Preview: "Use the code to confirm your email change"
  - Displays 6-digit code in a styled box with expiry notice
### Frontend — Posts Pages (New)
- `posts.html` + `posts.css` + `posts.js`:
  - Card grid sorted newest first, no grouping
  - Cards show: thumbnail (first image), type badge (News/Announcement/Event), title, office name (DLSU-D if null), date posted
  - Single row filter controls: search bar, type dropdown, office dropdown (dynamic from fetched posts), date mode toggle (Single/Range), date picker(s), clear filters button (appears only when filters active)
  - All filters work together simultaneously
  - View modal: image gallery with auto-swap carousel and dot navigation, type badge, office name, date, title, Quill rich text content, Edit and Delete buttons
  - Delete confirm modal with confirmation
- `posts-add.html` + `posts-add.css` + `posts-add.js`:
  - Two-column layout (form-left / form-right) matching building-add pattern
  - Fields: title, type dropdown, office dropdown (dynamic from DB, DLSU-D = null), content (Quill), images (min 1 required)
  - Back link navigates to `posts.html`
  - Image upload with preview grid, duplicate file detection, remove preview
  - Validates all required fields before submit
- `posts-edit.html` + `posts-edit.css` + `posts-edit.js`:
  - Same layout as posts-add, prefills all fields from DB using `?id=` URL param
  - Redirects immediately to `posts.html` if no id in URL
  - Existing images shown with click-to-mark-for-removal (red border + trash overlay), click again to undo
  - New images appended alongside kept existing images
  - Validates min 1 image will remain after removals
  - Office field fix: always appends office to FormData (even empty string) to correctly set null in DB
### Frontend — Feedbacks Page (New)
- `feedbacks.html` + `feedbacks.css` + `feedbacks.js`:
  - Card grid sorted newest first
  - Filter tabs: All / Unread (with live count badge) / Read
  - Unread cards styled with green left border and squared left corners (border-radius: 0 12px 12px 0)
  - Cards show: star rating, comment (or "No comment provided." if null), date
  - Clicking card opens view modal and auto-marks feedback as read in background
  - Unread count badge on tab updates live after reading
  - View modal: star rating, comment, date, Delete button
  - Delete confirm modal with confirmation
### Frontend — Settings Page (New)
- `settings.html` + `settings.css` + `settings.js`:
  - Three cards: Profile (name), Email Address, Security (password)
  - Profile card: update name only, prefilled from `GET /api/auth/me`
  - Email card: current email shown as disabled read-only field, new email input, sends verification code via `POST /api/accounts/me/email-change`
  - Verification modal: 6-digit code input (numeric only), 3-minute countdown timer, auto-closes and disables verify button on expiry, refreshes displayed email on success
  - Security card: current password + new password + confirm new password, show/hide toggle on all password fields, min 8 character validation

## V0.7 — 12/04/2026
### Backend
- Made `GET /api/buildings` and `GET /api/buildings/:id` public — kiosk no longer requires auth to fetch buildings
- Made `GET /api/offices` and `GET /api/offices/:id` public — kiosk no longer requires auth to fetch offices
- Made `GET /api/faqs` public, now filters `isVisible: true` at DB level — kiosk no longer requires auth, hidden FAQs excluded automatically
- Added `weatherRoutes.js`:
  - `GET /api/weather` — public, proxies OpenWeatherMap API using coordinates for Dasmariñas, Cavite (lat: 14.3294, lon: 120.9367), returns temp, feels_like, condition, description, icon, humidity, city
  - Wired `/api/weather` into `server.js`
  - `OPENWEATHER_API_KEY` added to `.env`
### Frontend — User Side (New)
- `home.html` + `home.css` + `home.js`:
  - Fullscreen glassmorphism layout with campus background image
  - Top bar: DLSU-D logo, school name, live clock (updates every second)
  - Left panel: news/announcements carousel — fetches latest 5 posts, auto-slides every 5 seconds, manual prev/next arrows, dot navigation, Read More links to `news-detail.html`
  - Right panel: weather widget (temp, description, humidity, icon, city) refreshes every 10 minutes + 2x2 quick access grid (Interactive Map, Learn about the Campus, Virtual Tour, FAQs)
  - View More News links to `news.html`
  - Loading via `Promise.all` for weather and posts simultaneously
- `news.html` + `news.css` + `news.js`:
  - Clean white page with dark green top bar, back button, live clock
  - Posts grouped by date (e.g. "April 12, 2026"), only dates with posts shown
  - Sorted newest first, no grouping by type
  - Filters: type dropdown (News/Announcement/Event), month selector, year selector (dynamic from actual post dates)
  - All filters work together simultaneously
  - Sticky header with title and filters
  - Cards show: thumbnail, type badge, title, office name
  - Links to `news-detail.html?id=...`
- `news-detail.html` + `news-detail.css` + `news-detail.js`:
  - Clean white page, same top bar pattern
  - Back button uses `history.back()` — returns to wherever user came from (home or news list)
  - Hero image at top, thumbnail gallery below (click to swap hero) — only shown if more than 1 image
  - Sticky meta: type badge, office name, date
  - Title in EB Garamond
  - Full Quill rich text content rendered
  - Redirects to `news.html` if no `?id=` in URL
- `faqs.html` + `faqs.css` + `faqs.js`:
  - Clean white page, same top bar pattern
  - Back button uses `history.back()`
  - Accordion — only one FAQ open at a time, clicking same one closes it
  - Search bar highlights matching text in both question and answer with yellow highlight
  - Only visible FAQs shown (filtered at DB level)
  - Sticky header with title, subtitle, and search bar
  - Empty state for no results
- `map.html` + `map.css` + `map.js`:
  - Full screen interactive campus map
  - SVG rendered from DB data (`/api/buildings`, `/api/mapgraph`)
  - Roads rendered as bottom layer, buildings on top grouped by category with color coding
  - Buildings have drop-shadow for subtle 3D lifted effect
  - Zoom (scroll wheel) and pan (drag) with canvas limits — cannot pan outside 1920x1080 SVG bounds
  - Zoom buttons (+/-/reset) fixed top right of map
  - **Left panel** (collapsible):
    - Search bar takes remaining space next to collapse toggle button
    - Buildings grouped by category (Buildings, Facilities, Gates, Landmarks, Parking) — each category collapsible
    - Offices only appear when searching
    - Each item has focus (crosshair) and directions (navigation) action buttons
    - Clicking item focuses map on that building
  - **Right info panel** (slides in on building click):
    - Image carousel with dot navigation (sticky top)
    - Sticky building header: category badge, maintenance badge if applicable, building name
    - Scrollable body: description, offices list with office hours
    - Sticky footer: Get Directions button
  - **Directions modal**:
    - Destination pre-filled from selected building
    - From: searchable input with dropdown + 3 quick start buttons (Ayuntamiento ADG, Magdalo Gate G1, Magdiwang Gate G3)
    - Travel mode toggle: Walking / Vehicle
    - Walking — all edges bidirectional; Vehicle — respects one-way edge direction
  - **A* pathfinding** implemented:
    - Animated dashed green path drawn on SVG
    - Green circle = start, red circle = end
    - Map auto-focuses on path midpoint after route found
    - Route bar at bottom shows From → To with Clear Route button
    - Error handling for no node assigned and no path found
  - **Map Legend** bottom left — Building, Facility, Gate, Landmark, Parking
  - **Feedback FAB** excluded from map legend overlap via placement
- `feedback.html` + `feedback.js` + `feedback.css` (User-side shared component):
  - Floating action button fixed bottom right on all user pages
  - Clicking opens modal with 5-star rating (hover preview, click to select) and optional comment textarea
  - Submit → `POST /api/feedbacks` → success state with auto-close after 2.5 seconds
  - Error handling with button feedback
  - Fetches HTML from `feedback.html` via JS — same pattern as admin sidebar
  - No `type="module"` needed — plain script tag on each page

## V0.8 — 12/04/2026
### Backend
- Added `CampusInfo.js` model:
  - Fields: key (unique String), label (String), content (Quill HTML, default null), icon (String, default null), type (enum: 'rich_text' | 'core_value', default 'rich_text')
  - Timestamps auto
- Added `campusInfoRoutes.js`:
  - `GET /api/campus-info` — fetch all sections sorted by createdAt, public
  - `GET /api/campus-info/:key` — fetch single section by key, public
  - `PATCH /api/campus-info/:key` — update content and/or icon, protected (verifyToken)
  - Wired `/api/campus-info` into `server.js`
- Added `seedCampusInfo.js` — seeds 8 sections:
  - `mission` — rich_text
  - `vision` — rich_text
  - `about` — rich_text
  - `core_value_1` (Faith) — core_value, icon: bx-church
  - `core_value_2` (Service) — core_value, icon: bx-donate-heart
  - `core_value_3` (Communion in Mission) — core_value, icon: bx-group
  - `hymn` — rich_text
  - `contact` — rich_text
  - Safe to re-run (skips existing keys)
### Frontend — Admin (New)
- `campus-info.html` + `campus-info.css` + `campus-info.js`:
  - One card per section, no add or delete — edit only
  - Each card shows: icon, label, last updated date, Edit button
  - **Rich text sections** — Quill editor inline, preview shows rendered HTML
  - **Core value sections** — icon picker grid (16 Boxicons options) + Quill editor for description
  - Preview mode by default, clicking Edit switches to editor inline
  - Cancel restores original content
  - Content loaded into Quill only when Edit is opened (fixes empty editor bug)
  - Save patches via `PATCH /api/campus-info/:key`
  - Updates preview and last updated date after save
### Frontend — User Side (New)
- `campus-info.html` + `campus-info.css` + `campus-info.js`:
  - Full page snap scroll — one section per viewport height
  - Vertical dot indicator (right side) with hover label, adapts color per section background, wrapped in glass pill for visibility
  - Clicking dot navigates to that section
  - IntersectionObserver updates active dot on scroll
  - **Section 1 — Mission & Vision** (campus bg + bleeding white card):
    - Two-column layout — Mission left, Vision right, divider in between
    - Each column has label, title, and rich text content
  - **Section 2 — About DLSU-D** (white bg):
    - Large decorative "1977" year in sage green on left
    - Content block on right with label, title, rich text
  - **Section 3 — Core Values** (campus bg + bleeding white card):
    - Left side: big title and subtitle
    - Right side: stacked value cards each with icon, name, description and green left border accent
  - **Section 4 — Alma Mater Hymn** (dirty white bg):
    - Centered layout with music icon, scrollable hymn content box in italic EB Garamond
  - **Section 5 — Contact Information** (campus bg + bleeding white card):
    - Two-column content layout
  - **Section 6 — Our Offices** (dirty white bg):
    - Sticky header (Directory label + Our Offices title) and search bar
    - Scrollable office cards grid below, grouped by category
    - Cards show: office name, office hours, email, phone
    - Clicking card opens full detail modal with gallery, category badge, name, head, contact info pills, description (Quill rendered with correct list styles), personnel list, building location
    - Category groups have top margin spacing between them# Navigate La Salle
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

## V0.3 — 10/04/2026
### Frontend — Sidebar (Revamp)
- Removed collapse toggle entirely — sidebar is now fixed width (80px)
- Removed admin name/role display from sidebar
- New dark green vertical icon-based sidebar design
- Icons with labels below each, subtle dividers between sections
- Theme toggle becomes clickable icon in footer (moon/sun)
- Sign Out button at bottom with icon and label
- Modals updated to match new design language (blur backdrop, EB Garamond headings)
### Frontend — Auth Pages Redesign
- login.css — full redesign: fluid layout, EB Garamond headings, Noto Sans body,
  staggered entrance animations, green glow on input focus, lift effect on button,
  image section with green gradient overlay and brand name, responsive breakpoints
- forgot-password.css — matching redesign consistent with login, backdrop blur modal,
  back link with sage-green hover, column-reverse on mobile
- reset-password.css — matching redesign, password rules styled as card,
  disabled button handled via CSS :disabled pseudo-class
- register.css — matching redesign, readonly email field styled, expired modal
### Frontend — Accounts Page
- accounts.css — full redesign: dirty-white background, white card main-content,
  Noto Sans typography, sticky table headers, no row dividers with hover highlight,
  role badges differentiated (superadmin gets border)
- Added "you" badge on current logged-in user's row
- Fixed table stretching on large screens
- Fixed main-content card height via align-items: flex-start on main
### Frontend — FAQ Page
- faq.css — full redesign matching design language
- faq.html — added Create FAQ modal with floating label inputs and Delete FAQ modal
- faq.js — wired up create and delete:
  - Create FAQ with POST /api/faq, toast feedback, refetch on success
  - Delete FAQ with DELETE /api/faq/:id, confirmation modal, toast feedback
  - Fixed double deleteBtn declaration bug
  - Fixed openDeleteFaqModal scope issue
  - Smooth collapse/expand animation via max-height transition
## V0.4 — 11/04/2026
### Backend
- Added cloudinary.js config
- Added upload.js middleware with multer-storage-cloudinary:
  - Subfolders per resource type (buildings/, offices/, news/)
  - quality: auto and fetch_format: auto for automatic compression
  - 10MB file size limit with proper error handling
- Added Building.js model:
  - Fields: name, dataId (unique), category, description, images, isVisible, shape
  - Shape supports rect (x,y,width,height,rotate,rx,ry) and ellipse (cx,cy,rx,ry)
  - isVisible repurposed as Open/Under Maintenance toggle
- Added buildingRoutes.js:
  - GET /api/buildings — fetch all sorted by category then name
  - GET /api/buildings/:id — fetch one
  - POST /api/buildings — create with Cloudinary image upload
  - PATCH /api/buildings/:id — update, handles image removal from Cloudinary
  - DELETE /api/buildings/:id — delete from DB and Cloudinary
- Added seedBuildings.js — seeds all 57 map elements from SVG campus map
### Frontend — Building Page
- building.html — list + map view with tab toggle
- building.css — cards grouped by category, map SVG view, view modal with gallery
- building.js:
  - List view — cards grouped by category with image/placeholder
  - Map view — SVG rendered from DB shape data, clickable elements
  - View modal — image carousel with auto-swap (3s), dot navigation resets timer,
    scrollable without scrollbar, centered content
  - Delete modal — confirms before delete
  - Remembers list/map view when returning from edit via URL param
### Frontend — Building Edit Page
- building-edit.html — prefilled form with all building fields
- building-edit.css — two-column layout, image management
- building-edit.js:
  - Fetches building by ID from URL param, redirects if not found
  - Quill.js rich text editor for description
  - Existing images shown with X to remove (deletes from Cloudinary on save)
  - New image upload with preview and individual removal
  - Visibility toggle labeled Open / Under Maintenance
  - Empty Quill saves as null not HTML empty state
  - Cancel and save return to correct list/map view via URL param
### Frontend — Building Add Page
- building-add.html — two-step flow
- building-add.css — step cards, map editor, form layouts
- building-add.js:
  - Step 1: Map editor — choose shape type (rect/ellipse), set dimensions,
    drag to position on SVG map, real-time position display, confirm position
  - Step 2: Building info form — name, dataId, category, status, description, images
  - Existing buildings shown as faded reference on map
  - Back to map button returns to Step 1

## V0.5 — 11/04/2026
### Backend
- Added `road` as a valid category in `Building.js` model enum
- Added `seedRoads.js` — seeds 28 campus roads into the buildings collection:
  - All named roads, trails, and rotundas from the campus SVG map
  - Skips existing entries (safe to re-run, no deleteMany)
- Added `MapGraph.js` model:
  - Single document collection storing the full campus navigation graph
  - Nodes: id, x, y, buildingId (stores Building `_id`, null if road waypoint)
  - Edges: from, to, weight (auto-calculated Euclidean distance), type (both/one-way), direction (from→to / to→from)
- Added `mapGraphRoutes.js`:
  - `GET /api/mapgraph` — fetch graph (public, kiosk will need it later)
  - `PUT /api/mapgraph` — save entire graph, replaces existing (protected)
  - Validates edge node references exist
  - Enforces max 10 edges per node
- Added `Office.js` model:
  - Fields: name, category (free text String, no enum), head, description (Quill HTML), email, phone, officeHours, images (Cloudinary), personnel ([{role, name}]), subOffices ([ObjectId ref Office]), building (ObjectId ref Building), isVisible
  - category is dynamic — managed from frontend, not hardcoded in model
- Added `officeRoutes.js`:
  - `GET /api/offices` — get all, supports `?building=id` query filter for fetching offices by building
  - `GET /api/offices/:id` — get one
  - `POST /api/offices` — create with uploadOffice image upload
  - `PATCH /api/offices/:id` — update, handles image removal from Cloudinary
  - `DELETE /api/offices/:id` — deletes from DB, Cloudinary, and removes from any parent subOffices arrays
- Wired `/api/mapgraph` and `/api/offices` into `server.js`
### Frontend — Building Page (Updated)
- `building.html`:
  - Added Graph tab alongside List and Map
  - Map view legend added below canvas (building types + scroll/pan hint)
  - View modal now shows "Offices in this Building" section (read-only, fetched from `/api/offices?building=id`, hidden if none)
- `building.css`:
  - Added Graph view styles: toolbar, ghost buildings, node styles, edge styles, grid, road preview, legend
  - Added map legend styles
  - Added modal offices section styles
  - Updated map building colors to pastel palette, road color muted
  - Added drop-shadow to buildings, facilities, gates, landmarks for subtle 3D depth
- `building.js`:
  - Splits fetched data into `allBuildings` (non-road) and `allRoads` (category: road)
  - Roads now fetched from DB dynamically — no hardcoded road data
  - Map view renders roads from DB as non-interactive background layer before buildings
  - Map view: zoom (scroll) and pan (Alt+drag) via `initZoomPan()`
  - Graph view — full graph editor:
    - Node mode: click empty space to place node, click+drag existing node to reposition, hover shows live map coordinates, placed node shows x/y coordinates
    - Edge mode: click node A then node B to connect, auto-calculates Euclidean weight, supports chaining, enforces 10-edge limit, blocks duplicate edges
    - Assign mode: click node then click faded building ghost to assign — stores Building `_id` not dataId, node label displays dataId via lookup
    - Delete mode: click node to remove it and all its edges, click edge line to remove just that edge, click road shape to delete road from DB
    - Road mode: fill in road name and ID, click and drag to draw new rect road segment, saves to DB via POST /api/buildings
    - Grid overlay (40px squares) for node placement alignment
    - Loads existing graph from backend on first tab open
    - Save Graph button PUTs full graph state to /api/mapgraph
    - Edge direction toggle (Two-way / One-way) shown only in Edge mode
    - One-way edges render dashed with arrowhead marker
    - Ghost buildings show assigned state (green stroke) when linked to a node
- `building-add.js`:
  - Added zoom/pan via `initZoomPan()` — scroll to zoom, Alt+drag to pan
  - getSVGCoords replaced with version returned by initZoomPan
  - Overlap detection on Confirm Position — checks new shape bounding box against all existing non-road buildings, blocks if overlapping
  - Roads rendered as muted grey reference layer on add map
### Frontend — Office Pages (New)
- `offices.html` + `office.css` + `office.js`:
  - Card grid grouped by section/category with search filter (name, category, head)
  - View modal: gallery with auto-swap carousel, section badge, visibility badge (orange if under maintenance), name, head, contact info pills (email/phone/hours), Quill description, personnel list, sub-offices list, building reference
  - Delete modal with confirmation — also cleans up subOffices references in parent offices
- `office-add.html` + `office-add.css` + `office-add.js`:
  - Straight form, no map editor (offices have no SVG shape)
  - Dynamic section dropdown: unique categories fetched from DB + always includes "Unaffiliated" + "+ Create New Section" option which reveals a text input
  - Building dropdown populated from DB (roads excluded)
  - Sub-offices: searchable dropdown, selected offices shown as removable green tags
  - Personnel: add/remove rows with role and name inputs
  - Back/cancel navigate to `office.html`
- `office-edit.html` + `office-edit.css` + `office-edit.js`:
  - Same layout as office-add, prefills all fields from DB
  - Existing images shown with X to mark for removal (toggle, click again to undo)
  - Dynamic section dropdown handles custom categories not in existing list
  - Sub-office dropdown excludes the office being edited (cannot add itself)
  - Back/cancel navigate to `office.html`

## V0.6 — 11/04/2026
### Backend
- Added `Post.js` model:
  - Fields: title, content (Quill HTML), type (enum: news/announcement/event), office (ObjectId ref Office, null = DLSU-D campus-wide), images ([String], min 1 required), createdAt/updatedAt (auto timestamps)
  - No isVisible field
- Added `postRoutes.js`:
  - `GET /api/posts` — fetch all, public (kiosk needs it), supports `?type=` and `?office=` query filters, populates office name and category
  - `GET /api/posts/:id` — fetch one, public
  - `POST /api/posts` — create with uploadNews image upload, enforces min 1 image (protected)
  - `PATCH /api/posts/:id` — update, handles image removal from Cloudinary, enforces min 1 image remaining (protected)
  - `DELETE /api/posts/:id` — deletes from DB and Cloudinary (protected)
  - Wired `/api/posts` into `server.js`
- Added `Feedback.js` model:
  - Fields: rating (Number, 1-5, required), comment (String, optional, default null), isRead (Boolean, default false), createdAt/updatedAt (auto timestamps)
- Added `feedbackRoutes.js`:
  - `GET /api/feedbacks` — fetch all, sorted newest first, supports `?isRead=true|false` filter (protected)
  - `POST /api/feedbacks` — create, public (kiosk submits feedback)
  - `PATCH /api/feedbacks/:id/read` — mark as read (protected)
  - `DELETE /api/feedbacks/:id` — delete (protected)
  - Wired `/api/feedbacks` into `server.js`
- Added `seedFeedbacks.js` — seeds 10 sample feedbacks (mix of read/unread, with/without comments, varied ratings, safe to re-run via duplicate check)
- Updated `accountRoutes.js`:
  - `PATCH /api/accounts/me` — update own name only (email removed from this route)
  - `POST /api/accounts/me/email-change` — generates 6-digit code, saves to Admin doc with 3-minute expiry, sends code to current email via Brevo Template ID 5
  - `PATCH /api/accounts/me/email-change/verify` — verifies code, applies new email, clears code fields
  - `PATCH /api/accounts/me/password` — change password with current password verification
- Updated `Admin.js` model:
  - Added `emailChangeCode` (String, default null)
  - Added `emailChangeExpires` (Date, default null)
  - Added `emailChangePending` (String, default null)
- Updated `emailService.js`:
  - Added `sendEmailChangeCode` — sends Brevo Template ID 5 with params: FIRSTNAME, CODE, EXPIRES_IN
- Added Brevo Template ID 5 — Email Change Verification:
  - Subject: "Email Change Verification"
  - Preview: "Use the code to confirm your email change"
  - Displays 6-digit code in a styled box with expiry notice
### Frontend — Posts Pages (New)
- `posts.html` + `posts.css` + `posts.js`:
  - Card grid sorted newest first, no grouping
  - Cards show: thumbnail (first image), type badge (News/Announcement/Event), title, office name (DLSU-D if null), date posted
  - Single row filter controls: search bar, type dropdown, office dropdown (dynamic from fetched posts), date mode toggle (Single/Range), date picker(s), clear filters button (appears only when filters active)
  - All filters work together simultaneously
  - View modal: image gallery with auto-swap carousel and dot navigation, type badge, office name, date, title, Quill rich text content, Edit and Delete buttons
  - Delete confirm modal with confirmation
- `posts-add.html` + `posts-add.css` + `posts-add.js`:
  - Two-column layout (form-left / form-right) matching building-add pattern
  - Fields: title, type dropdown, office dropdown (dynamic from DB, DLSU-D = null), content (Quill), images (min 1 required)
  - Back link navigates to `posts.html`
  - Image upload with preview grid, duplicate file detection, remove preview
  - Validates all required fields before submit
- `posts-edit.html` + `posts-edit.css` + `posts-edit.js`:
  - Same layout as posts-add, prefills all fields from DB using `?id=` URL param
  - Redirects immediately to `posts.html` if no id in URL
  - Existing images shown with click-to-mark-for-removal (red border + trash overlay), click again to undo
  - New images appended alongside kept existing images
  - Validates min 1 image will remain after removals
  - Office field fix: always appends office to FormData (even empty string) to correctly set null in DB
### Frontend — Feedbacks Page (New)
- `feedbacks.html` + `feedbacks.css` + `feedbacks.js`:
  - Card grid sorted newest first
  - Filter tabs: All / Unread (with live count badge) / Read
  - Unread cards styled with green left border and squared left corners (border-radius: 0 12px 12px 0)
  - Cards show: star rating, comment (or "No comment provided." if null), date
  - Clicking card opens view modal and auto-marks feedback as read in background
  - Unread count badge on tab updates live after reading
  - View modal: star rating, comment, date, Delete button
  - Delete confirm modal with confirmation
### Frontend — Settings Page (New)
- `settings.html` + `settings.css` + `settings.js`:
  - Three cards: Profile (name), Email Address, Security (password)
  - Profile card: update name only, prefilled from `GET /api/auth/me`
  - Email card: current email shown as disabled read-only field, new email input, sends verification code via `POST /api/accounts/me/email-change`
  - Verification modal: 6-digit code input (numeric only), 3-minute countdown timer, auto-closes and disables verify button on expiry, refreshes displayed email on success
  - Security card: current password + new password + confirm new password, show/hide toggle on all password fields, min 8 character validation

## V0.7 — 12/04/2026
### Backend
- Made `GET /api/buildings` and `GET /api/buildings/:id` public — kiosk no longer requires auth to fetch buildings
- Made `GET /api/offices` and `GET /api/offices/:id` public — kiosk no longer requires auth to fetch offices
- Made `GET /api/faqs` public, now filters `isVisible: true` at DB level — kiosk no longer requires auth, hidden FAQs excluded automatically
- Added `weatherRoutes.js`:
  - `GET /api/weather` — public, proxies OpenWeatherMap API using coordinates for Dasmariñas, Cavite (lat: 14.3294, lon: 120.9367), returns temp, feels_like, condition, description, icon, humidity, city
  - Wired `/api/weather` into `server.js`
  - `OPENWEATHER_API_KEY` added to `.env`
### Frontend — User Side (New)
- `home.html` + `home.css` + `home.js`:
  - Fullscreen glassmorphism layout with campus background image
  - Top bar: DLSU-D logo, school name, live clock (updates every second)
  - Left panel: news/announcements carousel — fetches latest 5 posts, auto-slides every 5 seconds, manual prev/next arrows, dot navigation, Read More links to `news-detail.html`
  - Right panel: weather widget (temp, description, humidity, icon, city) refreshes every 10 minutes + 2x2 quick access grid (Interactive Map, Learn about the Campus, Virtual Tour, FAQs)
  - View More News links to `news.html`
  - Loading via `Promise.all` for weather and posts simultaneously
- `news.html` + `news.css` + `news.js`:
  - Clean white page with dark green top bar, back button, live clock
  - Posts grouped by date (e.g. "April 12, 2026"), only dates with posts shown
  - Sorted newest first, no grouping by type
  - Filters: type dropdown (News/Announcement/Event), month selector, year selector (dynamic from actual post dates)
  - All filters work together simultaneously
  - Sticky header with title and filters
  - Cards show: thumbnail, type badge, title, office name
  - Links to `news-detail.html?id=...`
- `news-detail.html` + `news-detail.css` + `news-detail.js`:
  - Clean white page, same top bar pattern
  - Back button uses `history.back()` — returns to wherever user came from (home or news list)
  - Hero image at top, thumbnail gallery below (click to swap hero) — only shown if more than 1 image
  - Sticky meta: type badge, office name, date
  - Title in EB Garamond
  - Full Quill rich text content rendered
  - Redirects to `news.html` if no `?id=` in URL
- `faqs.html` + `faqs.css` + `faqs.js`:
  - Clean white page, same top bar pattern
  - Back button uses `history.back()`
  - Accordion — only one FAQ open at a time, clicking same one closes it
  - Search bar highlights matching text in both question and answer with yellow highlight
  - Only visible FAQs shown (filtered at DB level)
  - Sticky header with title, subtitle, and search bar
  - Empty state for no results
- `map.html` + `map.css` + `map.js`:
  - Full screen interactive campus map
  - SVG rendered from DB data (`/api/buildings`, `/api/mapgraph`)
  - Roads rendered as bottom layer, buildings on top grouped by category with color coding
  - Buildings have drop-shadow for subtle 3D lifted effect
  - Zoom (scroll wheel) and pan (drag) with canvas limits — cannot pan outside 1920x1080 SVG bounds
  - Zoom buttons (+/-/reset) fixed top right of map
  - **Left panel** (collapsible):
    - Search bar takes remaining space next to collapse toggle button
    - Buildings grouped by category (Buildings, Facilities, Gates, Landmarks, Parking) — each category collapsible
    - Offices only appear when searching
    - Each item has focus (crosshair) and directions (navigation) action buttons
    - Clicking item focuses map on that building
  - **Right info panel** (slides in on building click):
    - Image carousel with dot navigation (sticky top)
    - Sticky building header: category badge, maintenance badge if applicable, building name
    - Scrollable body: description, offices list with office hours
    - Sticky footer: Get Directions button
  - **Directions modal**:
    - Destination pre-filled from selected building
    - From: searchable input with dropdown + 3 quick start buttons (Ayuntamiento ADG, Magdalo Gate G1, Magdiwang Gate G3)
    - Travel mode toggle: Walking / Vehicle
    - Walking — all edges bidirectional; Vehicle — respects one-way edge direction
  - **A* pathfinding** implemented:
    - Animated dashed green path drawn on SVG
    - Green circle = start, red circle = end
    - Map auto-focuses on path midpoint after route found
    - Route bar at bottom shows From → To with Clear Route button
    - Error handling for no node assigned and no path found
  - **Map Legend** bottom left — Building, Facility, Gate, Landmark, Parking
  - **Feedback FAB** excluded from map legend overlap via placement
- `feedback.html` + `feedback.js` + `feedback.css` (User-side shared component):
  - Floating action button fixed bottom right on all user pages
  - Clicking opens modal with 5-star rating (hover preview, click to select) and optional comment textarea
  - Submit → `POST /api/feedbacks` → success state with auto-close after 2.5 seconds
  - Error handling with button feedback
  - Fetches HTML from `feedback.html` via JS — same pattern as admin sidebar
  - No `type="module"` needed — plain script tag on each page

## V0.8 — 12/04/2026
### Backend
- Added `CampusInfo.js` model:
  - Fields: key (unique String), label (String), content (Quill HTML, default null), icon (String, default null), type (enum: 'rich_text' | 'core_value', default 'rich_text')
  - Timestamps auto
- Added `campusInfoRoutes.js`:
  - `GET /api/campus-info` — fetch all sections sorted by createdAt, public
  - `GET /api/campus-info/:key` — fetch single section by key, public
  - `PATCH /api/campus-info/:key` — update content and/or icon, protected (verifyToken)
  - Wired `/api/campus-info` into `server.js`
- Added `seedCampusInfo.js` — seeds 8 sections:
  - `mission` — rich_text
  - `vision` — rich_text
  - `about` — rich_text
  - `core_value_1` (Faith) — core_value, icon: bx-church
  - `core_value_2` (Service) — core_value, icon: bx-donate-heart
  - `core_value_3` (Communion in Mission) — core_value, icon: bx-group
  - `hymn` — rich_text
  - `contact` — rich_text
  - Safe to re-run (skips existing keys)
### Frontend — Admin (New)
- `campus-info.html` + `campus-info.css` + `campus-info.js`:
  - One card per section, no add or delete — edit only
  - Each card shows: icon, label, last updated date, Edit button
  - **Rich text sections** — Quill editor inline, preview shows rendered HTML
  - **Core value sections** — icon picker grid (16 Boxicons options) + Quill editor for description
  - Preview mode by default, clicking Edit switches to editor inline
  - Cancel restores original content
  - Content loaded into Quill only when Edit is opened (fixes empty editor bug)
  - Save patches via `PATCH /api/campus-info/:key`
  - Updates preview and last updated date after save
### Frontend — User Side (New)
- `campus-info.html` + `campus-info.css` + `campus-info.js`:
  - Full page snap scroll — one section per viewport height
  - Vertical dot indicator (right side) with hover label, adapts color per section background, wrapped in glass pill for visibility
  - Clicking dot navigates to that section
  - IntersectionObserver updates active dot on scroll
  - **Section 1 — Mission & Vision** (campus bg + bleeding white card):
    - Two-column layout — Mission left, Vision right, divider in between
    - Each column has label, title, and rich text content
  - **Section 2 — About DLSU-D** (white bg):
    - Large decorative "1977" year in sage green on left
    - Content block on right with label, title, rich text
  - **Section 3 — Core Values** (campus bg + bleeding white card):
    - Left side: big title and subtitle
    - Right side: stacked value cards each with icon, name, description and green left border accent
  - **Section 4 — Alma Mater Hymn** (dirty white bg):
    - Centered layout with music icon, scrollable hymn content box in italic EB Garamond
  - **Section 5 — Contact Information** (campus bg + bleeding white card):
    - Two-column content layout
  - **Section 6 — Our Offices** (dirty white bg):
    - Sticky header (Directory label + Our Offices title) and search bar
    - Scrollable office cards grid below, grouped by category
    - Cards show: office name, office hours, email, phone
    - Clicking card opens full detail modal with gallery, category badge, name, head, contact info pills, description (Quill rendered with correct list styles), personnel list, building location
    - Category groups have top margin spacing between them

## V0.9 — 13/04/2026
### Frontend — Admin (New)
- `dashboard.html` + `dashboard.css` + `dashboard.js`:
  - Greeting header — time-based (Good morning/afternoon/evening) with admin name fetched from `/api/auth/me`
  - Live date display (top right) formatted in Filipino locale (`en-PH`)
  - **Stat Cards** (6-card grid):
    - Buildings (excludes roads filtered client-side)
    - Offices
    - Posts
    - FAQs
    - Total Feedbacks
    - Unread Feedbacks — highlighted card (sage green bg, green border)
  - **Posts Breakdown** card:
    - Horizontal bar per post type: News, Announcement, Event
    - Bar width proportional to share of total posts
    - Color-coded: blue (News), orange (Announcement), green (Event)
    - Shows count per type on the right
    - Empty state if no posts
  - **Feedback Summary** card:
    - Large average score display with star rating (rounded to 1 decimal)
    - Rating distribution bars (5→1 stars), each showing count
    - "Based on N feedbacks" label
    - Empty state if no feedbacks
  - **Recent Posts** card:
    - Latest 5 posts sorted by `createdAt` descending
    - Each item: type icon, title (truncated), type label + formatted date
    - "View all" link → `posts.html`
    - Empty state if no posts
  - **Recent Feedbacks** card:
    - Latest 5 feedbacks sorted by `createdAt` descending
    - Each item: comment (falls back to "No comment left."), date, star rating, "New" badge if unread
    - "View all" link → `feedbacks.html`
    - Empty state if no feedbacks
  - All data fetched in parallel via `Promise.all` across 5 endpoints
  - Loading overlay shown during fetch, hidden in `finally`
  - Error toast on fetch failure
  - Added system icon for website

## V1.0 — 14/04/2026
### Backend — Graph
- Modified MapGraph.js
  - replaced 'type' and 'direction' fields
  - replaced exisiting 'edge'(edge is connection of nodes) category with 3 new ones ['pedestrian', 'vehicle', 'both']
- Modified mapGraphRoutes.js
  - Adding validation for the new one way/direction logic
  - Added 'oneWay: Boolean' - separate from type, only relevant for 'vehicle' and 'both'
  - 'direction' stay as-is, but now only set when oneWay: true
  - Route validates that pedestrian edges can't be one-way, and one-way edges must have a direction
### Frontend — Admin/map[js, css, html]
- Added additional controls
  - Add noselect mode to setGraphMode()
  - Add edge type selector UI (pedestrian / vehicle / both) in edge options, replacing the old two-way/one-way toggle (one-way becomes a sub-option only when vehicle or both is selected)
  - Update handleGraphClick edge creation to use new type + oneWay + direction schema
  - Update redrawGraph edge rendering — color-code by type instead of just dashed for one-way
  - Add undo stack: undoStack, savedSnapshot, markDirty(), undoLastAction()
  - Wire save button to reset dirty state, disable both buttons when clean
  - Add pushUndo() calls at every mutation point (add node, add edge, delete node, delete edge, move node, assign building)
  - Edges are now color-coded: blue (pedestrian), orange (vehicle), dark green (both)
### Frontend — User/map.js
- Update logic in wayfinding to fit upgraded model
  - Derives isWalkable (pedestrian or both) and isDrivable (vehicle or both) from the edge type
  - Walking mode: filters to walkable edges only, always traverses both directions
  - Vehicle mode: filters to drivable edges only, then checks edge.oneWay (boolean) instead of the old edge.type === 'one-way', and uses edge.direction to determine which way is allowed

## V1.1 — 15/04/2026
### Frontend — User Interactive Map
- Improve/Added draw-on path animation 
  - replaced the old 'polyline' with marching dashes by 'SVG' path element and is making a fill in/snake like transition from start to destination
- Hybrid vehicle + wall fallback
  - When vehicle route finds no route, instead of 'no route' finds the closest drivable node to the pedestrian-only destination
  - Run A* for vehicle leg (start -> dropoff) in yellow and walk leg (dropoff -> destination) in green, sequentially after the vehicle animation finishes
  - The route bar shows: 🚗 Drive to [Building], then 🚶 walk to [Destination]
  - If even the hybrid approach can't find a path, it falls back to the original "No route found" message.

## V1.1 — 15/04/2026
### Frontend — Admin Building Page
- Improved Building Admin Page
  - In list view:
    - Added search functionality
    - Added additional viewing mode - can now switch from Card to Row view toggle
    - Added collapsible category sections for buildings
  - In Map View
    - Added dataid/buildingid to be displayed on top of the buildings