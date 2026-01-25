# Guest Session Implementation Guide

## Overview

This document explains the production-ready guest session system implemented for the QuickOrders application. It prevents data loss from accidental page refreshes and provides secure session management for guest users.

## Architecture

### Backend Components

#### 1. **Guest Session Model** ([GuestSession.model.ts](backend/src/models/GuestSession.model.ts))

- **Purpose**: Stores guest session data in MongoDB
- **TTL Index**: Automatically deletes sessions after 2 hours (configurable)
- **Fields**:
  - `sessionId`: Unique session identifier
  - `tableNumber`: Associated table number
  - `customerName`: Guest's name
  - `customerId`: Used for order tracking
  - `cart`: Current cart items and total
  - `sessionStartTime`: When session began
  - `lastActivityTime`: Last user activity (for timeout detection)
  - `isActive`: Session status flag
  - `expiresAt`: Auto-deletion timestamp

**Key Feature**: MongoDB TTL index automatically removes expired sessions, no manual cleanup needed.

#### 2. **Guest Session Controller** ([guestSession.controller.ts](backend/src/controller/guestSession.controller.ts))

Provides 6 main endpoints:

| Endpoint               | Method | Purpose                              |
| ---------------------- | ------ | ------------------------------------ |
| `/create`              | POST   | Create new session after QR scan     |
| `/validate/:sessionId` | GET    | Check if session is valid and active |
| `/:sessionId`          | GET    | Retrieve session details             |
| `/:sessionId/cart`     | PUT    | Update cart in session (persistence) |
| `/:sessionId/end`      | POST   | End session (cleanup)                |
| `/table/:tableNumber`  | GET    | Get all active sessions for a table  |

**Session Timeout**: 2 hours (7200 seconds)

#### 3. **Guest Session Routes** ([guestSession.route.ts](backend/src/routes/guestSession.route.ts))

All routes exposed at `/api/guest-session/*`

#### 4. **Guest Session Middleware** ([guestSession.middleware.ts](backend/src/middleware/guestSession.middleware.ts))

- `validateGuestSessionMiddleware`: Required session validation
- `optionalGuestSession`: Optional session validation

Can be applied to order routes for extra security.

### Frontend Components

#### 5. **useGuestSession Hook** ([hooks/useGuestSession.ts](frontend/hooks/useGuestSession.ts))

Custom React hook for session management:

```typescript
const {
  sessionId, // Current session ID
  session, // Full session data
  isLoading, // Loading state
  isSessionValid, // Session validity flag
  createSession, // Create new session after QR
  restoreSession, // Restore from refresh
  updateCartInSession, // Save cart to session
  endSession, // End session
  refreshSession, // Refresh session data
} = useGuestSession();
```

**Features**:

- Auto-restores session on page load from localStorage
- Maintains dual storage (server + client localStorage backup)
- Validates session expiry
- Updates last activity time

#### 6. **Customer App Integration** ([customer-app-new.tsx](frontend/components/demo/customer-app-new.tsx))

**Modified Flows**:

1. **QR Scan → Name Entry** (unchanged)
2. **Name Entry** → Creates guest session on backend
3. **Add to Cart** → Can now survive refresh
4. **Checkout** → Saves cart to session + includes sessionId in order
5. **Exit** → Ends guest session and clears data

### Database Schema Changes

#### Order Model Updates

Added `sessionId` field to [Order.model.ts](backend/src/models/Order.model.ts):

```typescript
sessionId: { type: String, index: true }
```

This allows filtering orders by session and prevents showing old orders.

## User Flow Diagram

```
1. USER SCANS QR
   ↓
2. ENTERS NAME
   ↓
   [Backend] Creates GuestSession + HTTP-only Cookie
   [Frontend] Stores sessionId in localStorage
   ↓
3. BROWSING MENU (Session persisted)
   ↓
4. PAGE REFRESH (Unexpected)
   ↓
   [Frontend Hook] Restores session from localStorage
   [Frontend Hook] Validates session on backend
   ↓
5. SESSION VALID → User continues from where they left
6. SESSION EXPIRED → Redirect to QR scan
   ↓
7. CHECKOUT
   ↓
   [Frontend] Sends sessionId with order
   [Backend] Stores sessionId in Order document
   ↓
8. TRACKING ORDERS
   ↓
   [Backend] Filters by sessionId + customerId
   ↓
9. EXIT / PAYMENT COMPLETE
   ↓
   [Frontend] Calls endSession()
   [Backend] Sets isActive = false, clears cookie
   ↓
10. BACK TO QR SCAN
```

## Session Lifecycle

### Creation

```bash
POST /api/guest-session/create
{
  "tableNumber": 5,
  "customerName": "John"
}

Response:
{
  "success": true,
  "sessionId": "5-a1b2c3d4-...",
  "session": { ... },
  "message": "Guest session created successfully"
}
```

### Storage

1. **Server**: MongoDB with TTL
2. **Browser**:
   - HTTP-only Cookie (automatic)
   - localStorage (backup)

### Validation

```bash
GET /api/guest-session/validate/5-a1b2c3d4-...

Response:
{
  "success": true,
  "session": { ... }
}
```

### Expiration

- **Automatic**: MongoDB deletes after 2 hours
- **Manual**: User clicks exit/logout
- **Validation**: Backend checks `expiresAt` timestamp

## Security Features

✅ **HTTP-Only Cookies**: Session ID not accessible via JavaScript  
✅ **Secure Transport**: HTTPS in production  
✅ **SameSite Policy**: Prevents CSRF attacks  
✅ **Session Validation**: Server validates every request  
✅ **TTL Expiration**: Automatic cleanup prevents stale sessions  
✅ **Activity Tracking**: `lastActivityTime` for monitoring  
✅ **Indexed Queries**: Fast lookups by sessionId, tableNumber

## Production Deployment

### Pre-Deployment Checklist

- [ ] Install dependencies:

  ```bash
  npm install uuid cookie-parser
  npm install --save-dev @types/uuid @types/cookie-parser
  ```

- [ ] Verify environment variables in `.env`:

  ```
  NODE_ENV=production
  MONGODB_URI=your_production_db
  JWT_SECRET=your_secret
  ```

- [ ] MongoDB TTL Index will auto-create via Mongoose schema

- [ ] Test session endpoints:

  ```bash
  # Create session
  curl -X POST http://localhost:5000/api/guest-session/create \
    -H "Content-Type: application/json" \
    -d '{"tableNumber": 1, "customerName": "Test"}'

  # Validate session
  curl http://localhost:5000/api/guest-session/validate/SESSION_ID
  ```

### Configuration Options

Modify `SESSION_DURATION` in [guestSession.controller.ts](backend/src/controller/guestSession.controller.ts):

```typescript
// Current: 2 hours
const SESSION_DURATION = 2 * 60 * 60 * 1000;

// Examples:
// 30 minutes: 30 * 60 * 1000
// 1 hour:     60 * 60 * 1000
// 4 hours:    4 * 60 * 60 * 1000
```

## Testing Scenarios

### Scenario 1: Accidental Refresh

1. Scan QR → Enter name → Browse menu
2. Press F5 (refresh page)
3. **Expected**: Session restored, continue from menu with cart intact

### Scenario 2: Session Timeout

1. Create session → Wait 2+ hours
2. Try to add order
3. **Expected**: Session expired error → Redirect to QR scan

### Scenario 3: Network Failure

1. Create session → Add items to cart
2. Disconnect internet → Reconnect
3. **Expected**: Hook tries to validate, falls back to localStorage

### Scenario 4: Multiple Tables

1. Guest A scans Table 1
2. Guest B scans Table 1 (Table 1 becomes occupied)
3. **Expected**: Guest B sees error "Table is currently occupied"

## API Reference

### Create Session

```http
POST /api/guest-session/create
Content-Type: application/json

{
  "tableNumber": 5,
  "customerName": "John Doe"
}

Response 201:
{
  "success": true,
  "sessionId": "5-uuid-here",
  "session": {
    "_id": "...",
    "sessionId": "...",
    "tableNumber": 5,
    "customerName": "John Doe",
    "customerId": "John Doe",
    "cart": { "items": [], "totalAmount": 0 },
    "sessionStartTime": "2024-01-25T...",
    "lastActivityTime": "2024-01-25T...",
    "isActive": true,
    "expiresAt": "2024-01-25T..."
  }
}

Set-Cookie: guestSessionId=5-uuid-here; HttpOnly; Secure; SameSite=Strict
```

### Validate Session

```http
GET /api/guest-session/validate/5-uuid-here

Response 200:
{
  "success": true,
  "session": { ... }
}

Response 404:
{
  "success": false,
  "message": "Session not found or expired"
}
```

### Update Cart

```http
PUT /api/guest-session/5-uuid-here/cart
Content-Type: application/json

{
  "items": [
    {
      "_id": "menu-item-id",
      "name": "Burger",
      "category": "Food",
      "price": 500,
      "image": "url",
      "quantity": 2
    }
  ],
  "totalAmount": 1000
}

Response 200:
{
  "success": true,
  "session": { ... }
}
```

### End Session

```http
POST /api/guest-session/5-uuid-here/end

Response 200:
{
  "success": true,
  "message": "Session ended successfully"
}

Set-Cookie: guestSessionId=; Max-Age=0
```

## Frontend Hook Usage

```typescript
// In your component
const {
  sessionId,
  session,
  isLoading,
  isSessionValid,
  createSession,
  restoreSession,
  updateCartInSession,
  endSession,
  refreshSession,
} = useGuestSession();

// Create session after QR scan and name entry
const handleNameSubmit = async () => {
  const success = await createSession(tableNumber, customerName);
  if (success) {
    // Navigate to menu
  }
};

// Save cart when checking out
const handleCheckout = async () => {
  await updateCartInSession(cart, totalAmount);
  // Then submit order
};

// End session on exit
const handleExit = async () => {
  await endSession();
  // Reset to QR scan
};

// Hook auto-restores on mount
// No need to call restoreSession manually
```

## Troubleshooting

### Session Returns 404

- **Cause**: Session expired (>2 hours) or invalid ID
- **Solution**: Clear localStorage, scan QR again

### Cart Not Persisting

- **Cause**: updateCartInSession not called before refresh
- **Solution**: Call updateCartInSession in handleCheckout and when cart updates

### Cookie Not Set

- **Cause**: Not using `withCredentials: true` in axios
- **Solution**: Add to all requests:
  ```typescript
  axios.post(url, data, { withCredentials: true });
  ```

### Multiple Sessions for Same Table

- **Cause**: Intentional - supports multiple guests at same table
- **Solution**: Use sessionId to distinguish orders

## Performance Considerations

- **Index on sessionId**: O(1) lookup
- **Index on tableNumber**: Fast table queries
- **TTL Index**: Background cleanup, minimal overhead
- **localStorage**: No network request on refresh
- **Dual Storage**: Server as source of truth, client as backup

## Future Enhancements

1. **Session Replay**: Store user actions for replay on reconnect
2. **Offline Support**: IndexedDB for offline cart management
3. **Device Fingerprinting**: Detect suspicious session access
4. **Analytics**: Track session duration, cart abandonment
5. **Guest Accounts**: Optional signup after session
6. **Session Sharing**: QR code to join existing session

## References

- [MongoDB TTL Documentation](https://docs.mongodb.com/manual/tutorial/expire-data/)
- [Express Cookie Parser](https://github.com/expressjs/cookie-parser)
- [HTTP-Only Cookies](https://owasp.org/www-community/attacks/csrf)
- [Next.js Cookie Management](https://nextjs.org/docs/app/api-reference/functions/cookies)

---

**Last Updated**: January 25, 2026  
**Status**: Production Ready ✅
