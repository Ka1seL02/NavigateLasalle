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