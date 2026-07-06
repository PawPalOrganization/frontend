# Paw-Pal - Project Structure

## Overview
Pet management application built with React + Vite + Bootstrap

## Folder Structure

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   ├── Input.jsx
│   │   │   └── Input.module.css
│   │   ├── Modal/
│   │   │   └── Modal.jsx
│   │   ├── Card/
│   │   │   └── Card.jsx
│   │   ├── Avatar/
│   │   │   └── Avatar.jsx
│   │   ├── Slider/
│   │   │   └── Slider.jsx
│   │   ├── SelectionCard/
│   │   │   └── SelectionCard.jsx
│   │   ├── EmptyState/
│   │   │   └── EmptyState.jsx
│   │   └── QRCode/
│   │       └── QRCode.jsx
│   │
│   ├── layout/              # Layout components
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.module.css
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.module.css
│   │   ├── MainLayout/
│   │   │   └── MainLayout.jsx
│   │   └── ProfileSwitcher/
│   │       └── ProfileSwitcher.jsx
│   │
│   └── features/            # Feature-specific components
│       ├── PetProfile/
│       │   ├── PetProfileCard.jsx
│       │   └── PetProfileCarousel.jsx
│       ├── HealthCard/
│       │   ├── HealthInfo.jsx
│       │   ├── VaccineList.jsx
│       │   └── InsuranceCard.jsx
│       ├── Nutrition/
│       │   ├── MealTracker.jsx
│       │   └── RecipeCard.jsx
│       └── Activities/
│           ├── WalkTracker.jsx
│           └── ActivityMap.jsx
│
├── pages/                   # Page components (route level)
│   ├── Onboarding/
│   │   ├── Onboarding.jsx
│   │   └── CreateAccount.jsx
│   ├── Login/
│   │   └── Login.jsx
│   ├── ValidationCode/
│   │   └── ValidationCode.jsx
│   ├── Dashboard/
│   │   └── Dashboard.jsx
│   ├── AddPetProfile/
│   │   ├── AddPetProfile.jsx
│   │   ├── steps/
│   │   │   ├── BreedSelection.jsx
│   │   │   ├── NameStep.jsx
│   │   │   ├── SizeStep.jsx
│   │   │   ├── WeightStep.jsx
│   │   │   ├── ImportantDates.jsx
│   │   │   └── Caretakers.jsx
│   ├── ShareProfile/
│   │   └── ShareProfile.jsx
│   ├── HealthCard/
│   │   └── HealthCard.jsx
│   ├── Nutrition/
│   │   └── Nutrition.jsx
│   └── Activities/
│       └── Activities.jsx
│
├── hooks/                   # Custom React hooks
│   ├── usePetProfile.js
│   ├── useAuth.js
│   └── useForm.js
│
├── context/                 # React Context providers
│   ├── AuthContext.jsx
│   ├── PetContext.jsx
│   └── ThemeContext.jsx
│
├── services/                # API services
│   ├── api.js
│   ├── petService.js
│   └── authService.js
│
├── utils/                   # Utility functions
│   ├── validators.js
│   ├── formatters.js
│   └── helpers.js
│
├── assets/                  # Static assets
│   ├── images/
│   │   └── dog-placeholder.png
│   └── icons/
│       └── logo.svg
│
├── styles/                  # Global styles
│   ├── variables.css
│   ├── global.css
│   └── theme.css
│
└── constants/               # Constants and configuration
    ├── routes.js
    ├── colors.js
    └── config.js
```

---

## Admin Dashboard Structure (✅ FOUNDATION COMPLETE)

### Overview
Admin web dashboard for managing users, pets, and system configuration. Built separately from mobile app with different authentication.

**Status:** Core foundation complete with working authentication, layout, and live dashboard statistics. All management pages complete (Users, Pets, Pet Types, Pet Breeds, Admins) with full CRUD operations. App Settings page with WYSIWYG editor for Terms & Conditions. Responsive design, debounced search, file upload, and skeleton loading implemented.

**Last Updated:** February 14, 2026

### ✨ Session Summary (Feb 14, 2026: App Settings + Breed Images)

**What We Built:**
- ✅ App Settings Management Page (`/admin/app-settings`) — edit-only for predefined settings
- ✅ WYSIWYG rich text editor (ReactQuill) for Terms & Conditions HTML content
- ✅ Bulk update API pattern — `PUT /admin/api/app-settings` with array body `[{id, value}]`
- ✅ Nested value handling — API stores values as `{value: "actual_value"}` objects
- ✅ Image upload support added to Pet Breeds page (dual: file + URL paste)
- ✅ PawLoader component used for upload loading states (replaces Bootstrap spinners)
- ✅ Lazy loading for AppSettings page (`React.lazy()` + `Suspense`) to reduce main bundle size
- ✅ New dependency: `react-quill-new` for React 19-compatible WYSIWYG editing

**Key Technical Decisions:**
- `react-quill-new` over `react-quill` — maintained fork with React 18+/19 support
- Lazy-loaded AppSettings page — keeps ReactQuill (~100KB) out of main bundle
- Conditional editor rendering — only `terms_and_conditions` token gets WYSIWYG, others get plain input
- Bulk PUT endpoint — API updates settings as array `[{id, value: {value: "..."}}]`, no individual routes
- `:global` in SCSS modules — required to style Quill's internal classes from CSS modules

### ✨ Session Summary (Feb 9, 2026: Phase 2 Enhancements)

**What We Built:**
- ✅ Pet Type Breeds Management Page (full CRUD with pet type filter dropdown)
- ✅ File Upload Service (`adminFilesService.js`) for image uploads
- ✅ Dual image upload (file button + URL paste) on PetTypes and Pets pages
- ✅ Debounced search (600ms) across all 5 management pages using `useRef`
- ✅ Controls disabled during loading (search inputs + filter selects)
- ✅ Skeleton loading on every fetch (not just initial load)
- ✅ Image display with `startsWith('http')` guard for Expo `file:///` paths
- ✅ Upload uses `signedUrl` (private bucket, `publicUrl` not accessible)
- ✅ Cascading petType → breed dropdowns in Pets form
- ✅ Weight "kg" auto-append and normalization
- ✅ Adoption date cannot be before birthdate validation
- ✅ 409 conflict error handling on all delete operations
- ✅ `parseInt()` for HTML select values before sending to API

**Key Technical Decisions:**
- `signedUrl` over `publicUrl` — S3 bucket is private, signed URLs expire in 1h
- `useRef` for debounce timer — persists across re-renders without triggering them
- `TablePageSkeleton` shown on every fetch — user always knows data is refreshing
- `imageUrl?.startsWith('http')` — existing mobile data has `file:///` Expo paths

### ✨ Session Summary (Feb 1, 2026: Phase 1 Complete)

**What We Built:**
- ✅ Pet Types Management Page (complete CRUD operations)
- ✅ Admins Management Page (complete CRUD operations)
- ✅ Updated App.jsx routing for both new pages
- ✅ Consistent design system maintained across all pages
- ✅ Skeleton loading integrated for both pages
- ✅ Search functionality for filtering data
- ✅ Form validation and error handling
- ✅ Delete confirmation modals

**Now Available:**
- Full Pet Types management at `/admin/pet-types` (create, read, update, delete)
  - Fields: Type Name (required), Description (optional)
  - Simple textarea for description input
- Full Admins management at `/admin/admins` (create, read, update, delete)
  - Fields: Name, Email, Password (optional on edit)
  - Password validation (min 6 characters)

**Phase 1 Status:**
- ✅ ALL Phase 1 management pages complete
- ✅ Consistent CRUD pattern across all pages
- ✅ Responsive design (991px tables, 1200px sidebar)
- ✅ LinkedIn-style skeleton loading
- ✅ Production-ready (no console logs)

### ✨ Session Summary (Jan 30, 2026 - Part 2: Responsive Design)

**What We Built:**
- ✅ Collapsible sidebar with hamburger menu for mobile
- ✅ Responsive DataTable with horizontal scrolling
- ✅ Mobile-friendly page headers and buttons
- ✅ Responsive modals (full-width on mobile, stacked buttons)
- ✅ Touch-friendly form layouts (single column on mobile)
- ✅ Adaptive content padding and spacing
- ✅ Smooth animations and transitions

**Responsive Features:**
- Sidebar collapses on screens ≤768px with overlay
- Tables scroll horizontally on narrow screens
- Forms switch to single-column layout on mobile
- Modal buttons stack vertically for easier tapping
- All elements properly sized for touch interaction

### ✨ Session Summary (Jan 30, 2026 - Part 1: CRUD Management)

**What We Built:**
- ✅ DataTable component (reusable table with pagination, search, actions)
- ✅ Users Management Page (complete CRUD operations)
- ✅ Pets Management Page (complete CRUD operations with owner/type dropdowns)
- ✅ Search functionality across both management pages
- ✅ Form validation and error handling
- ✅ Delete confirmation modals
- ✅ Consistent design system maintained
- ✅ Fixed API data formatting (camelCase, capitalized enums, age calculation)

**Now Available:**
- Full Users management at `/admin/users` (create, read, update, delete)
- Full Pets management at `/admin/pets` (create, read, update, delete)
- Search users by name or email
- Search pets by name or breed
- Pagination for large datasets

### ✨ Session Summary (Jan 28, 2026)

**What We Built:**
- ✅ Complete admin authentication system (login/logout with JWT)
- ✅ Admin API service layer (all CRUD endpoints wrapped)
- ✅ Reusable UI components (Button, Input, Modal)
- ✅ Admin sidebar with navigation and profile
- ✅ Dashboard with live statistics from backend
- ✅ Fixed CORS, proxy configuration, and SPA routing
- ✅ Proper logout with redirect functionality

**Ready to Use:**
- Login at `/login` with superadmin credentials
- View live stats on dashboard (users, pets, admins, pet types)
- Navigate through sidebar (layout ready for new pages)
- All services ready to build CRUD pages

### Completed Components

```
src/
├── services/                    # ✅ COMPLETE - Admin API Layer
│   ├── adminApi.js             # Admin Axios instance (/admin/api)
│   ├── adminAuthService.js     # Admin login/logout
│   ├── adminUsersService.js    # Users CRUD operations
│   ├── adminPetsService.js     # Pets CRUD operations
│   ├── adminPetTypesService.js # Pet Types CRUD
│   ├── adminPetTypeBreedsService.js # Pet Type Breeds CRUD
│   ├── adminFilesService.js   # File upload (multipart/form-data)
│   ├── adminAdminsService.js   # Admins management
│   └── adminAppSettingsService.js # App settings (bulk PUT)
│
├── context/                     # ✅ COMPLETE - Admin Auth
│   └── AdminAuthContext.jsx    # Admin authentication state
│
├── components/
│   ├── common/                  # ✅ COMPLETE - Reusable Components
│   │   ├── Button/
│   │   │   ├── Button.jsx      # Multi-variant button (primary, danger, outline)
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   ├── Input.jsx       # Form input with label, error, icon
│   │   │   └── Input.module.css
│   │   ├── Modal/
│   │   │   ├── Modal.jsx       # Dialog modal (small, medium, large)
│   │   │   └── Modal.css
│   │   ├── DataTable/           # ✅ Reusable Data Table
│   │   │   ├── DataTable.jsx    # Table with pagination, search, actions
│   │   │   └── DataTable.module.scss
│   │   └── Skeleton/            # ✅ Skeleton Loading Components
│   │       ├── Skeleton.jsx     # Base shimmer component
│   │       ├── Skeleton.module.scss
│   │       ├── TablePageSkeleton.jsx   # Full page skeleton
│   │       ├── TablePageSkeleton.module.scss
│   │       ├── PageHeaderSkeleton.jsx
│   │       └── PageHeaderSkeleton.module.scss
│   │
│   └── layout/                  # ✅ COMPLETE - Admin Layout
│       ├── AdminSidebar/
│       │   ├── AdminSidebar.jsx        # Dark sidebar with navigation
│       │   └── AdminSidebar.module.scss
│       └── AdminLayout/
│           ├── AdminLayout.jsx         # Layout wrapper with sidebar
│           └── AdminLayout.module.scss
│
└── pages/
    ├── Login/                   # ✅ COMPLETE - Admin Login
    │   ├── Login.jsx           # Converted to admin authentication
    │   └── Login.module.scss
    │
    └── Admin/                   # ✅ COMPLETE - Admin Pages
        ├── Dashboard.jsx       # Dashboard with live stats from API
        ├── Dashboard.module.scss
        ├── Users.jsx           # ✅ Users management (full CRUD)
        ├── Users.module.scss
        ├── Pets.jsx            # ✅ Pets management (full CRUD)
        ├── Pets.module.scss
        ├── PetTypes.jsx        # ✅ Pet Types management (full CRUD + image upload)
        ├── PetTypes.module.scss
        ├── PetTypeBreeds.jsx   # ✅ Pet Breeds management (full CRUD + type filter)
        ├── PetTypeBreeds.module.scss
        ├── Admins.jsx          # ✅ Admins management (full CRUD)
        ├── Admins.module.scss
        ├── AppSettings.jsx     # ✅ App Settings (edit-only, ReactQuill WYSIWYG)
        └── AppSettings.module.scss
```

### Admin Routes Structure

```javascript
/login                          // ✅ Admin login page
/admin
  ├── /dashboard               // ✅ Dashboard with live stats (COMPLETE)
  ├── /users                   // ✅ Users management (COMPLETE)
  ├── /pets                    // ✅ Pets management (COMPLETE)
  ├── /pet-types               // ✅ Pet Types management (COMPLETE)
  ├── /pet-type-breeds         // ✅ Pet Breeds management (COMPLETE)
  ├── /admins                  // ✅ Admins management (COMPLETE)
  ├── /app-settings            // ✅ App Settings (edit-only, WYSIWYG for T&C)
  ├── /account                 // ⏳ TODO: Account settings
  └── /settings                // ⏳ TODO: System settings
```

### Current Working Features

**✅ Fully Functional:**
- **Admin Login** - Login with email/password, JWT token storage
- **Admin Logout** - Clears session and redirects to login
- **Dashboard Stats** - Displays real-time counts:
  - Total Users (fetched from `/admin/api/users`)
  - Total Pets (fetched from `/admin/api/pets`)
  - Admins (fetched from `/admin/api/admins`)
  - Pet Types (fetched from `/admin/api/pet-types`)
- **Sidebar Navigation** - Active route highlighting, profile display
- **Authentication Flow** - Auto-login from localStorage, token refresh on reload
- **Users Management** - Full CRUD operations:
  - List users with pagination (10 per page)
  - Search users by name or email
  - Create new users with validation
  - Edit existing users
  - Delete users with confirmation modal
  - Fields: First Name, Last Name, Email, Phone, Password, Birth Date, Gender
- **Pets Management** - Full CRUD operations:
  - List pets with owner, type, breed, gender, size, weight columns
  - Search pets by name or breed (debounced 600ms)
  - Cascading dropdowns: Pet Type → Breed (reloads breeds on type change)
  - Dual image upload (file + URL paste) with `signedUrl`
  - Weight auto-appends "kg", adoption date validates against birthdate
  - Delete with 409 conflict handling
  - Fields: Pet Name, Owner, Pet Type, Breed, Birthdate, Gender, Size, Weight, Age, Notes, Image, Adoption Date
- **Pet Types Management** - Full CRUD operations:
  - List all pet types with pagination
  - Search pet types by name (debounced 600ms)
  - Create/edit with dual image upload (file + URL paste)
  - Delete with 409 conflict handling
  - Fields: Type Name (required), Image (upload or URL)
- **Pet Breeds Management** - Full CRUD operations:
  - List breeds with pet type filter dropdown
  - Search breeds by name (debounced 600ms)
  - Create/edit with pet type selection + dual image upload (file + URL paste)
  - Delete with 409 conflict handling
  - Fields: Breed Name (required), Pet Type (required dropdown), Image (upload or URL)
- **Admins Management** - Full CRUD operations:
  - List all admin accounts with pagination
  - Search admins by name or email
  - Create new admin accounts
  - Edit existing admins
  - Delete admins with confirmation modal
  - Fields: Name, Email, Password (min 6 chars, optional on edit)
- **App Settings Management** - Edit-only for predefined settings:
  - List all app settings (Name, Value, Description, Created)
  - Edit settings via modal (Name is read-only, Token is hidden)
  - WYSIWYG rich text editor (ReactQuill) for Terms & Conditions
  - Plain text input for other settings (App Name, Timezone Offset)
  - Bulk update API: `PUT /app-settings` with `[{id, value: {value: "..."}}]`
  - Lazy-loaded page (React.lazy + Suspense) to reduce main bundle
  - Settings: App Name, App Time Zone Offset, Terms and Conditions

**🔧 Important Technical Fixes:**
1. **CORS Fixed** - Vite proxy configured for `/admin/api` endpoints
2. **SPA Routing Fixed** - Changed proxy from `/admin` to `/admin/api` to allow client-side routing
3. **API Response Structure** - Backend returns `{ data, meta }` not `{ data: { pagination } }`
4. **Logout Navigation** - Added redirect to login after logout

**📋 API Response Format:**
```javascript
// Backend response structure:
{
  success: true,
  message: "...",
  data: [...],      // Array of items
  meta: {           // Pagination info
    total: 12,
    page: 1,
    limit: 10,
    totalPages: 2
  }
}
```

### Admin API Endpoints (Backend)

**Authentication:**
- `POST /admin/api/auth/login` - Admin login

**Users Management:**
- `GET /admin/api/users` - List users (pagination, search)
- `GET /admin/api/users/:id` - Get user details
- `POST /admin/api/users` - Create user
- `PUT /admin/api/users/:id` - Update user
- `DELETE /admin/api/users/:id` - Delete user
- `GET /admin/api/users/dropdown` - Users dropdown (id, name, email only)

**Pets Management:**
- `GET /admin/api/pets` - List pets (pagination, search, filters)
- `GET /admin/api/pets/:id` - Get pet details
- `POST /admin/api/pets` - Create pet
- `PUT /admin/api/pets/:id` - Update pet
- `DELETE /admin/api/pets/:id` - Delete pet
- `GET /admin/api/pets/user/:userId` - Get user's pets

**Pet Types Management:**
- `GET /admin/api/pet-types` - List pet types
- `GET /admin/api/pet-types/:id` - Get pet type
- `POST /admin/api/pet-types` - Create pet type
- `PUT /admin/api/pet-types/:id` - Update pet type
- `DELETE /admin/api/pet-types/:id` - Delete pet type

**Pet Type Breeds Management:**
- `GET /admin/api/pet-type-breeds` - List breeds (pagination, search, petTypeId filter)
- `GET /admin/api/pet-type-breeds/:id` - Get breed
- `POST /admin/api/pet-type-breeds` - Create breed
- `PUT /admin/api/pet-type-breeds/:id` - Update breed
- `DELETE /admin/api/pet-type-breeds/:id` - Delete breed

**File Management:**
- `POST /admin/api/files/upload` - Upload file (multipart/form-data)
  - Returns: `{ success, message, data: { bucket, key, signedUrl, publicUrl } }`
  - `signedUrl` has auth tokens (expires 1h) — use this for display
  - `publicUrl` is NOT publicly accessible (private bucket)

**App Settings Management:**
- `GET /admin/api/app-settings` - List all app settings (supports page, limit, search)
- `PUT /admin/api/app-settings` - Bulk update settings (body: `[{id, value: {value: "..."}}]`)
  - Response: `{ success, message, data: [...updated settings] }`
  - Note: Uses nested `value.value` structure (JSON column storage)

**Admins Management:**
- `GET /admin/api/admins` - List admins
- `GET /admin/api/admins/:id` - Get admin details
- `POST /admin/api/admins` - Create admin
- `PUT /admin/api/admins/:id` - Update admin
- `DELETE /admin/api/admins/:id` - Delete admin

### Admin Authentication Flow

1. Admin logs in at `/login`
2. Credentials sent to `POST /admin/api/auth/login`
3. Receives JWT token + admin data
4. Token stored in localStorage as `adminToken`
5. All subsequent admin API calls include `Authorization: Bearer {token}`
6. On 401 error, redirect to login and clear token

### Reusable Components

**Button Component:**
```jsx
<Button variant="primary|secondary|danger|outline"
        size="small|medium|large"
        loading={boolean}
        icon="bi-plus"
        fullWidth={boolean}>
  Label
</Button>
```

**Input Component:**
```jsx
<Input label="Email"
       type="email"
       placeholder="Enter email"
       value={value}
       onChange={handler}
       error="Error message"
       icon="bi-envelope"
       required={boolean} />
```

**Modal Component:**
```jsx
<Modal isOpen={boolean}
       onClose={handler}
       title="Modal Title"
       size="small|medium|large"
       footer={<Buttons />}>
  {children}
</Modal>
```

**DataTable Component:**
```jsx
<DataTable
       columns={[
         { key: 'name', label: 'Name', width: '20%' },
         { key: 'email', label: 'Email', width: '30%' },
         { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> }
       ]}
       data={items}
       loading={boolean}
       currentPage={number}
       totalPages={number}
       totalItems={number}
       onPageChange={handler}
       onEdit={handler}
       onDelete={handler}
       emptyMessage="No items found" />
```

### Next Steps (TODO)

#### Phase 1: Management Pages ✅ COMPLETE
- [x] Users Management Page (list, create, edit, delete) ✅
- [x] Pets Management Page (list, create, edit, delete) ✅
- [x] Pet Types Management Page (list, create, edit, delete) ✅
- [x] Pet Type Breeds Management Page (list, create, edit, delete + filter) ✅
- [x] Admins Management Page (list, create, edit, delete) ✅

#### Phase 2: UX Enhancements ✅ COMPLETE
- [x] DataTable component (pagination, sorting, search) ✅
- [x] Debounced search (600ms) across all pages ✅
- [x] Controls disabled during loading ✅
- [x] Skeleton loading on every fetch ✅
- [x] File upload service (dual: file + URL paste) ✅
- [x] Image upload on PetTypes and Pets ✅
- [x] 409 conflict error handling on delete ✅
- [x] Form validation (required fields, adoption date vs birthdate) ✅
- [x] Dashboard statistics with real data ✅

#### Phase 3: Features
- [ ] Protected routes (redirect if not authenticated)
- [ ] Toast notifications
- [ ] Error handling UI

#### Phase 4: Polish
- [x] Responsive design (mobile sidebar) ✅
- [x] Responsive tables (horizontal scroll) ✅
- [x] Responsive modals and forms ✅
- [ ] Advanced table responsiveness (card view on mobile)
- [ ] Dark mode toggle
- [ ] User profile management
- [ ] Settings page
- [ ] Activity logs

### Test Credentials

**Superadmin (Pre-seeded):**
```
Email: superadmin@admin.com
Password: admin123
```

**Creating New Admins:**
Use Postman to create additional admin accounts:
```
POST {{baseUrl}}/admin/api/admins
Headers: Authorization: Bearer {{adminToken}}
Body: {
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```

### Development Setup

**1. Install Dependencies:**
```bash
npm install
```

**2. Configure Environment (Optional):**
Create `.env` file:
```
VITE_API_BASE_URL=https://backend-production-12d0.up.railway.app
```

**3. Start Dev Server:**
```bash
npm run dev
```

**4. Access Application:**
- Frontend: `http://localhost:5173`
- Login: `http://localhost:5173/login`
- Dashboard: `http://localhost:5173/admin/dashboard`

**Important Notes:**
- Vite proxy handles CORS in development (`/admin/api` → backend)
- Refresh works correctly (proxy only catches `/admin/api`, not `/admin/*`)
- Admin token stored in localStorage as `adminToken`
- Services return `response.data` (already unwrapped from Axios)

---

## Design System

### Colors
- **Primary Blue:** #0D9AFF
- **Dark Sidebar:** #1A1D2E
- **Background:** #F5F5F5
- **Text Primary:** #2C3E50
- **Text Secondary:** #7F8C8D
- **Success:** #27AE60
- **Warning:** #F39C12
- **Danger:** #E74C3C

### Typography
- Font Family: System fonts (Bootstrap default)
- Headings: Bold, larger sizes
- Body: Regular weight

### Spacing
- Base unit: 8px (Bootstrap uses rem)
- Consistent padding/margins using Bootstrap utilities

## Key Features

1. **Multi-Pet Management:** Users can manage multiple pet profiles
2. **Health Tracking:** Vaccines, insurance, medical records
3. **Nutrition:** Meal planning and tracking
4. **Activities:** Walk tracking with maps
5. **Profile Sharing:** QR code generation for sharing
6. **Onboarding:** Multi-step user registration

## Tech Stack
- React 19.2.0
- Vite 7.2.4
- Bootstrap 5
- React Router DOM
- React Bootstrap
- react-quill-new (WYSIWYG editor for rich text/HTML content)

## Getting Started

```bash
npm install
npm run dev
```
