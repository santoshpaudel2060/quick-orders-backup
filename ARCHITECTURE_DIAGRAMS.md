# System Architecture Diagram

## Session Lifecycle Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                               │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: QR SCAN
┌──────────────┐
│   Camera    │
│   Opens     │
└──────────────┘
      ↓
   Scans QR Code
   Gets: table=5
      ↓
┌────────────────────────┐
│  Table Number = 5      │
│  (Validated)           │
└────────────────────────┘


STEP 2: NAME ENTRY
┌────────────────────────┐     ┌─────────────────────────────────┐
│  User enters name      │────→│ POST /guest-session/create      │
│  "John Doe"            │     │                                 │
└────────────────────────┘     │ {                               │
                                │   tableNumber: 5,               │
                                │   customerName: "John Doe"      │
                                │ }                               │
                                └─────────────────────────────────┘
                                          ↓
                        ┌───────────────────────────────────────┐
                        │     MongoDB GuestSession              │
                        ├───────────────────────────────────────┤
                        │ sessionId: "5-uuid-123abc"            │
                        │ tableNumber: 5                        │
                        │ customerName: "John Doe"              │
                        │ customerId: "John Doe"                │
                        │ cart: { items: [], total: 0 }         │
                        │ sessionStartTime: 2024-01-25...       │
                        │ expiresAt: 2024-01-25 + 2h            │
                        │ isActive: true                        │
                        └───────────────────────────────────────┘
                                          ↓
                        ┌───────────────────────────────────────┐
                        │  HTTP Response                        │
                        ├───────────────────────────────────────┤
                        │ sessionId: "5-uuid-123abc"            │
                        │ Set-Cookie: guestSessionId=...;       │
                        │             HttpOnly; Secure;         │
                        │             SameSite=Strict            │
                        └───────────────────────────────────────┘
                                          ↓
                        ┌───────────────────────────────────────┐
                        │  Browser Storage                      │
                        ├───────────────────────────────────────┤
                        │ Cookies:                              │
                        │  - guestSessionId (HTTP-only)         │
                        │ localStorage:                         │
                        │  - guestSessionId                     │
                        │  - guestSession (full data)           │
                        │ React State:                          │
                        │  - sessionId                          │
                        │  - session object                     │
                        └───────────────────────────────────────┘


STEP 3: BROWSE MENU & ADD ITEMS
┌──────────────────────────┐
│  User Browsing Menu      │
│  Adds items to cart      │
│  - Burger (qty: 2)       │
│  - Soda (qty: 1)         │
└──────────────────────────┘
         ↓
   updateCartInSession()
   Called on each change
         ↓
┌────────────────────────────────────┐     ┌──────────────────────┐
│  PUT /guest-session/:sessionId/cart│────→│  MongoDB Updated     │
│                                    │     │  cart: { items: [..],│
│  {                                 │     │  totalAmount: 1500 } │
│    items: [...],                   │     └──────────────────────┘
│    totalAmount: 1500               │
│  }                                 │
└────────────────────────────────────┘


STEP 4: ACCIDENTAL REFRESH (Key Feature!)
┌──────────────────────────────────────────────────────────────────┐
│                    PAGE REFRESH DETECTED                         │
│                     (F5 / Browser Refresh)                       │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│            useGuestSession Hook Triggered                         │
│            (useEffect on component mount)                         │
└──────────────────────────────────────────────────────────────────┘
         ↓
    Check 3 Sources:
         ↓
    ┌────────────────┬────────────────┬────────────────┐
    ↓                ↓                ↓                ↓
 Cookies      localStorage      React State     Backend
 (HTTP-only)   (backup)        (lost)          (source of truth)
    │                │                │                │
    └────────────────┴────────────────┴────────────────┘
                        ↓
              Get sessionId (from cookie or localStorage)
                        ↓
         GET /guest-session/validate/sessionId
                        ↓
              ┌──────────────────────────────┐
              │  Backend Validation          │
              ├──────────────────────────────┤
              │ Find session in MongoDB      │
              │ Check: isActive = true?      │
              │ Check: expiresAt > now?      │
              │ Update: lastActivityTime     │
              └──────────────────────────────┘
                        ↓
                  SESSION VALID?
                    ↙          ↖
                  YES           NO
                   │             │
                   ↓             ↓
        ┌─────────────────┐  ┌──────────────┐
        │ Restore State   │  │ Redirect to  │
        │ - cart items    │  │ QR Scan      │
        │ - tableNumber   │  │              │
        │ - customerId    │  │ Clear local  │
        │ - sessionId     │  │ storage      │
        │                 │  └──────────────┘
        │ Continue order  │
        └─────────────────┘
              ↓
        ✅ USER CONTINUES


STEP 5: CHECKOUT
┌────────────────────────┐
│  User clicks Checkout  │
│  Cart: Burger x2, Soda │
│  Total: Rs. 1500       │
└────────────────────────┘
         ↓
  handleCheckout():
  1. updateSessionCart()
  2. POST /api/orders/add
         ↓
┌─────────────────────────────────────────┐
│  POST /api/orders/add                   │
├─────────────────────────────────────────┤
│  {                                      │
│    tableNumber: 5,                      │
│    customerId: "John Doe",              │
│    sessionId: "5-uuid-123abc",  ← NEW  │
│    items: [{                            │
│      name: "Burger",                    │
│      qty: 2,                            │
│      price: 600                         │
│    }],                                  │
│    totalAmount: 1500                    │
│  }                                      │
└─────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│     MongoDB Order Document               │
├──────────────────────────────────────────┤
│ _id: ObjectId(...)                       │
│ tableNumber: 5                           │
│ customerId: "John Doe"                   │
│ sessionId: "5-uuid-123abc"   ← Indexed  │
│ items: [...]                             │
│ status: "pending"                        │
│ totalAmount: 1500                        │
│ createdAt: 2024-01-25...                 │
└──────────────────────────────────────────┘
         ↓
   Order Tracking Page
   Shows orders by:
   - sessionId + customerId
   - Only orders from current session


STEP 6: EXIT / SESSION END
┌───────────────────────────┐
│  User Completes Payment   │
│  or clicks "Exit"         │
└───────────────────────────┘
         ↓
  endGuestSession():
  1. POST /guest-session/:sessionId/end
  2. Clear localStorage
  3. Clear React state
         ↓
┌──────────────────────────────────┐
│  MongoDB Update                  │
├──────────────────────────────────┤
│ isActive: false                  │
│ (TTL still expires in 2h)        │
└──────────────────────────────────┘
         ↓
┌──────────────────────────────────┐
│  Clear HTTP-only Cookie          │
├──────────────────────────────────┤
│ Set-Cookie: guestSessionId=;     │
│             Max-Age=0             │
└──────────────────────────────────┘
         ↓
   Back to QR Scan Screen
```

## Data Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (Client-Side)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTTP-Only Cookie:                                              │
│  ┌────────────────────────────────┐                            │
│  │ guestSessionId: 5-uuid-123abc  │  ← Secure                  │
│  │ • HttpOnly: true               │  ← Not accessible to JS    │
│  │ • Secure: true (prod)          │  ← HTTPS only              │
│  │ • SameSite: Strict             │  ← CSRF protected          │
│  │ • Path: /                      │                            │
│  │ • Expires: 2h                  │                            │
│  └────────────────────────────────┘                            │
│                                                                  │
│  localStorage (Backup):                                         │
│  ┌────────────────────────────────┐                            │
│  │ guestSessionId: "5-uuid-..."   │                            │
│  │ guestSession: {                │                            │
│  │   sessionId: "5-uuid-...",     │                            │
│  │   tableNumber: 5,              │                            │
│  │   customerId: "John",          │                            │
│  │   cart: {...},                 │                            │
│  │   ...                          │                            │
│  │ }                              │                            │
│  └────────────────────────────────┘                            │
│                                                                  │
│  React State (Runtime):                                         │
│  ┌────────────────────────────────┐                            │
│  │ sessionId: "5-uuid-..."        │                            │
│  │ session: GuestSessionData      │                            │
│  │ isSessionValid: boolean        │                            │
│  │ ...                            │                            │
│  └────────────────────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                         ↓ (API Calls)
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Backend)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Express.js + cookie-parser:                                    │
│  ┌────────────────────────────────┐                            │
│  │ req.cookies.guestSessionId     │                            │
│  │ req.headers['x-guest-session'] │                            │
│  │ req.query.sessionId            │                            │
│  └────────────────────────────────┘                            │
│         ↓ (Validate)                                            │
│  ┌────────────────────────────────┐                            │
│  │ MongoDB Query                  │                            │
│  │ Find {                          │                            │
│  │   sessionId: "5-uuid-...",     │                            │
│  │   isActive: true               │                            │
│  │ }                              │                            │
│  └────────────────────────────────┘                            │
│                                                                  │
│  MongoDB Collection: guestSessions                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ _id: ObjectId                                          │    │
│  │ sessionId: String (Indexed)  ← Fast lookup             │    │
│  │ tableNumber: Number (Indexed) ← Fast filtering         │    │
│  │ customerName: String                                   │    │
│  │ customerId: String                                     │    │
│  │ cart: {                                                │    │
│  │   items: [{                                            │    │
│  │     _id: String,                                       │    │
│  │     name: String,                                      │    │
│  │     quantity: Number,                                  │    │
│  │     price: Number                                      │    │
│  │   }],                                                  │    │
│  │   totalAmount: Number                                  │    │
│  │ }                                                      │    │
│  │ sessionStartTime: Date                                 │    │
│  │ lastActivityTime: Date                                 │    │
│  │ isActive: Boolean                                      │    │
│  │ expiresAt: Date ← TTL Index (auto-deletes)            │    │
│  │ createdAt: Date                                        │    │
│  │ updatedAt: Date                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  MongoDB Collection: orders                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ _id: ObjectId                                          │    │
│  │ tableNumber: Number                                    │    │
│  │ customerId: String                                     │    │
│  │ sessionId: String (Indexed) ← Link to session          │    │
│  │ items: [...]                                           │    │
│  │ status: String                                         │    │
│  │ totalAmount: Number                                    │    │
│  │ createdAt: Date                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   REQUEST FLOW                               │
└──────────────────────────────────────────────────────────────┘

CREATION REQUEST:
────────────────────────────────────────────────────────────────
Client                          Server                   Database
  │                               │                          │
  │ POST /guest-session/create    │                          │
  │ {tableNumber: 5, name: "John"}│                          │
  │──────────────────────────────→│                          │
  │                               │                          │
  │                        Generate sessionId                 │
  │                        Create GuestSession doc            │
  │                               │                          │
  │                               │ insertOne(GuestSession) │
  │                               │─────────────────────────→│
  │                               │                          │
  │                               │←─────────────────────────│
  │                               │ {_id, sessionId, ...}   │
  │                               │                          │
  │ Response 201                  │                          │
  │ {sessionId, ...}              │                          │
  │ Set-Cookie: guestSessionId    │                          │
  │←──────────────────────────────│                          │
  │                               │                          │


VALIDATION REQUEST:
────────────────────────────────────────────────────────────────
Client                          Server                   Database
  │                               │                          │
  │ GET /guest-session/validate/ID│                          │
  │─────────────────────────────→│                          │
  │                               │                          │
  │                        Extract sessionId from              │
  │                        cookie/header/param                 │
  │                               │                          │
  │                               │ findOne({               │
  │                               │   sessionId: ID,        │
  │                               │   isActive: true        │
  │                               │ })                      │
  │                               │─────────────────────────→│
  │                               │                          │
  │                               │←─────────────────────────│
  │                               │ {GuestSession doc}      │
  │                               │                          │
  │                        Check expiration                    │
  │                        Update lastActivityTime            │
  │                               │                          │
  │                               │ updateOne(save)        │
  │                               │─────────────────────────→│
  │                               │                          │
  │ Response 200                  │                          │
  │ {success: true, session: {...}}                          │
  │←──────────────────────────────│                          │
  │                               │                          │


CHECKOUT WITH SESSION:
────────────────────────────────────────────────────────────────
Client                          Server                   Database
  │                               │                          │
  │ POST /api/orders/add          │                          │
  │ {                             │                          │
  │   tableNumber: 5,             │                          │
  │   customerId: "John",         │                          │
  │   sessionId: "5-uuid-...",    │                          │
  │   items: [...]                │                          │
  │ }                             │                          │
  │─────────────────────────────→│                          │
  │                               │                          │
  │                        Validate session                    │
  │                        (middleware)                        │
  │                               │                          │
  │                               │ findOne(sessionId)     │
  │                               │─────────────────────────→│
  │                               │                          │
  │                               │←─────────────────────────│
  │                               │ {GuestSession}          │
  │                               │                          │
  │                        Calculate total                     │
  │                        Create Order doc                    │
  │                               │                          │
  │                               │ insertOne(Order)       │
  │                               │─────────────────────────→│
  │                               │                          │
  │                               │←─────────────────────────│
  │                               │ {_id, ...}             │
  │                               │                          │
  │ Response 200                  │                          │
  │ {order: {...}}                │                          │
  │←──────────────────────────────│                          │
  │                               │                          │
```

## Timeout & Cleanup Timeline

```
Session Created:
  2024-01-25 10:00:00 AM

Session Duration:
  ├─ 0min - 119min: Active ✓
  └─ 120min (2h): Expires

Timeline:
──────────────────────────────────────────────────────────────────

10:00 AM ├─ Session created
         │  • sessionStartTime = 2024-01-25 10:00:00
         │  • expiresAt = 2024-01-25 12:00:00
         │
10:15 AM ├─ User browsing menu
         │  • lastActivityTime updated
         │  • Session still active
         │
10:30 AM ├─ Adding items to cart
         │  • lastActivityTime updated
         │  • Session still active
         │
11:00 AM ├─ Checking out
         │  • Order created with sessionId
         │  • lastActivityTime updated
         │
12:00 PM ├─ EXPIRATION TIME
         │  • Session.expiresAt reached
         │  • MongoDB TTL Job runs
         │
12:01 PM ├─ Document deleted
         │  • GuestSession removed from DB
         │  • If user tries to validate:
         │    "Session not found or expired"

Alternative: User clicks Exit at 11:30 AM
──────────────────────────────────────────────────────────────────

11:30 AM ├─ User clicks Exit
         │  • POST /guest-session/sessionId/end
         │  • Backend: isActive = false
         │  • Frontend: Clear localStorage
         │  • Clear cookie
         │
         ├─ Session marked inactive
         │  • Still in DB (TTL will delete later)
         │  • Can't be validated anymore
         │
12:00 PM ├─ TTL still expires
         │  • Document deleted (cleanup)
```

---

**System is fully documented. Ready for production deployment!** ✅
