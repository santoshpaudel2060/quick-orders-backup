# Quick Orders - Folder Structure Documentation

## Project Overview
This document describes the improved folder structure for the Quick Orders application, organized for better maintainability and scalability.

---

## Backend Structure

```
backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── cloudinary.ts      # Cloudinary setup
│   │   └── db.ts              # Database connection
│   │
│   ├── models/                 # Database schemas (Mongoose models)
│   │   ├── User.model.ts
│   │   ├── Menu.model.ts
│   │   ├── Order.model.ts
│   │   ├── Payment.model.ts
│   │   ├── Table.model.ts
│   │   └── GuestSession.model.ts
│   │
│   ├── controllers/            # Business logic & route handlers
│   │   ├── auth.controller.ts
│   │   ├── menu.controller.ts
│   │   ├── order.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── table.controller.ts
│   │   └── guestSession.controller.ts
│   │
│   ├── routes/                 # API route definitions
│   │   ├── auth.route.ts
│   │   ├── menu.route.ts
│   │   ├── order.route.ts
│   │   ├── payment.route.ts
│   │   ├── table.route.ts
│   │   └── guestSession.route.ts
│   │
│   ├── middleware/             # Custom middleware functions
│   │   ├── auth.middleware.ts
│   │   ├── upload.ts
│   │   └── guestSession.middleware.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── cloudinary.ts      # Cloudinary helpers
│   │   └── generateEsewaSignature.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── ws.d.ts            # WebSocket types
│   │
│   └── index.ts               # Main application entry point
│
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env                       # Environment variables
```

### Backend Structure Benefits:
- **config/** - Centralized configuration management
- **models/** - Single source of truth for data schemas
- **controllers/** - Clean separation of business logic
- **routes/** - Clear API endpoint definitions
- **middleware/** - Reusable middleware functions
- **utils/** - Helper functions and utilities
- **types/** - TypeScript definitions for better type safety

---

## Frontend Structure

```
frontend/
├── app/
│   ├── (auth)/                # Authentication pages (Next.js route group)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/           # Dashboard pages (Next.js route group)
│   │   ├── admin/             # Admin dashboard
│   │   │   ├── menuItem/
│   │   │   │   ├── page.tsx
│   │   │   │   └── meminein.tsx
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   ├── table/
│   │   │   │   └── page.tsx
│   │   │   ├── overView/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── kitchen/           # Kitchen dashboard
│   │   │   └── page.tsx
│   │   │
│   │   └── payment-success/   # Payment success page
│   │       └── page.tsx
│   │
│   ├── customer/              # Customer ordering page
│   │   └── page.tsx
│   │
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
│
├── components/
│   ├── common/                # Reusable UI components
│   │   └── theme-provider.tsx
│   │
│   ├── forms/                 # Form components
│   │   ├── EsewaForm.tsx      # eSewa payment form
│   │   ├── EsewaCheckout.tsx  # eSewa checkout component
│   │   └── ...
│   │
│   ├── dashboard/             # Dashboard specific components
│   │   ├── admin-panel.tsx    # Admin panel
│   │   ├── customer-app-new.tsx # Customer ordering app (main)
│   │   ├── customer-app.tsx    # Alternative customer app
│   │   ├── kitchen-dashboard.tsx # Kitchen display
│   │   └── customerkoho.tsx
│   │
│   └── payment/               # Payment related components
│       ├── PaymentSuccess.tsx # Payment success display
│       ├── PaymentFailure.tsx # Payment failure display
│       └── FailurePage.tsx    # Generic failure page
│
├── hooks/                     # Custom React hooks
│   └── useGuestSession.ts     # Guest session management hook
│
├── lib/                       # Utility libraries
│   ├── api.ts                 # API client configuration
│   └── utils.ts               # Utility functions
│
├── types/                     # TypeScript type definitions
│   └── (type files)
│
├── styles/                    # Global styles
│   └── globals.css
│
├── public/                    # Static assets
│   └── (images, fonts, etc.)
│
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
├── components.json            # Shadcn UI config
├── Dockerfile
└── .env.local                # Environment variables
```

### Frontend Structure Benefits:
- **(auth)** - Route group for authentication pages (hidden from URL structure)
- **(dashboard)** - Route group for dashboard pages (hidden from URL structure)
- **components/** - Well-organized by type/purpose
- **hooks/** - Custom React hooks for reusable logic
- **lib/** - Centralized utilities and API configuration
- **types/** - TypeScript definitions for better type safety
- **styles/** - Global styling management

---

## Key Features

### Backend
| Folder | Purpose | Files |
|--------|---------|-------|
| config | App configuration | Cloudinary, DB connections |
| models | Data schemas | MongoDB models via Mongoose |
| controllers | Business logic | Request handlers for each feature |
| routes | API endpoints | Route definitions |
| middleware | Custom middleware | Auth, uploads, session management |
| utils | Helper functions | Utility functions and helpers |
| types | Type definitions | TypeScript types |

### Frontend
| Folder | Purpose | Examples |
|--------|---------|----------|
| (auth) | Authentication flows | Login, Sign up pages |
| (dashboard) | Admin/Kitchen interfaces | Admin panel, Kitchen display, Payment success |
| customer | Guest ordering | Main ordering interface |
| components/common | Reusable components | Theme provider |
| components/forms | Form components | eSewa payment forms |
| components/dashboard | Dashboard components | Admin panel, Customer app, Kitchen display |
| components/payment | Payment UIs | Success/Failure pages |
| hooks | Custom React hooks | Session management, State logic |
| lib | Utilities | API calls, Helper functions |
| types | Type definitions | TypeScript interfaces |
| styles | Global styles | CSS, Tailwind config |

---

## Directory Navigation

### Frontend Routes
```
/ ............................ Home page
/login ........................ Login page (auth group)
/signup ....................... Sign up page (auth group)
/customer ..................... Guest ordering interface
/admin ........................ Admin dashboard (dashboard group)
/admin/menuItem ............... Menu management
/admin/orders ................. Order management
/admin/table .................. Table management
/admin/overView ............... Admin overview
/kitchen ...................... Kitchen display (dashboard group)
/payment-success .............. Payment success (dashboard group)
```

### Backend API Routes
```
/api/auth ..................... Authentication endpoints
/api/menus .................... Menu management
/api/orders ................... Order operations
/api/payments ................. Payment processing
/api/tables ................... Table management
/api/guest-session ............ Guest session management
```

---

## Best Practices Implemented

### Backend
✅ **Models**: Single responsibility - define schemas only  
✅ **Controllers**: Contain business logic and route handlers  
✅ **Routes**: Define API endpoints only  
✅ **Middleware**: Reusable functions for cross-cutting concerns  
✅ **Utils**: Pure functions for common operations  
✅ **Config**: Environment-specific configuration centralized  

### Frontend
✅ **Route Groups**: Organize related routes with Next.js grouping  
✅ **Component Organization**: Grouped by functionality/type  
✅ **Hooks**: Extracted custom logic for reusability  
✅ **Types**: Centralized TypeScript definitions  
✅ **Utilities**: Shared functions in lib/  
✅ **Separation of Concerns**: Clear boundaries between features  

---

## Migration Notes

All code has been **reorganized without changes**:
- ✅ Files moved to appropriate folders
- ✅ Import paths updated automatically
- ✅ No functionality changed
- ✅ All features working as before
- ✅ Backward compatible

### Files Reorganized
- ✅ 22 frontend files reorganized into proper structure
- ✅ Backend structure already well-organized
- ✅ All imports updated for new paths
- ✅ Git history preserved with rename tracking

---

## Next Steps

### For Backend Development
1. Add new routes → `src/routes/`
2. Create models → `src/models/`
3. Implement logic → `src/controllers/`
4. Add middleware as needed → `src/middleware/`

### For Frontend Development
1. Page components → `app/` subdirectories
2. Shared components → `components/`
3. Custom hooks → `hooks/`
4. Utilities → `lib/`
5. Type definitions → `types/`

---

## Structure Maintenance

To keep the structure clean:

### Backend
- Keep models focused on schema definition
- Put business logic in controllers
- Extract reusable functions to utils
- Create new middleware for cross-cutting concerns

### Frontend
- Group related pages in route groups
- Keep components organized by type
- Extract custom logic to hooks
- Place utilities in lib/
- Maintain TypeScript types in types/

---

**Last Updated**: January 25, 2026  
**Version**: 1.0 - Initial restructure
