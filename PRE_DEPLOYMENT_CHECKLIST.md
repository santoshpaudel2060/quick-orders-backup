# Pre-Deployment Checklist

## ✅ Complete Pre-Deployment Verification

Use this checklist before deploying to production.

---

## Phase 1: Backend Setup

### Dependencies Installation

- [ ] Navigate to `backend/` directory
- [ ] Run `npm install`
- [ ] Verify no errors in installation
- [ ] Check `node_modules/uuid` exists
- [ ] Check `node_modules/cookie-parser` exists

### Code Validation

- [ ] [GuestSession.model.ts](backend/src/models/GuestSession.model.ts) created ✓
- [ ] [guestSession.controller.ts](backend/src/controller/guestSession.controller.ts) created ✓
- [ ] [guestSession.route.ts](backend/src/routes/guestSession.route.ts) created ✓
- [ ] [guestSession.middleware.ts](backend/src/middleware/guestSession.middleware.ts) created ✓
- [ ] [index.ts](backend/src/index.ts) updated with:
  - [ ] `import cookieParser from "cookie-parser"`
  - [ ] `import guestSessionRoutes from "./routes/guestSession.route.js"`
  - [ ] `app.use(cookieParser())`
  - [ ] `app.use("/api/guest-session", guestSessionRoutes)`
- [ ] [Order.model.ts](backend/src/models/Order.model.ts) updated with `sessionId` field
- [ ] [order.controller.ts](backend/src/controller/order.controller.ts) updated to accept `sessionId`

### TypeScript Compilation

- [ ] Run `npm run build` (if using TypeScript)
- [ ] No compilation errors
- [ ] All `.ts` files compile to `.js`

### MongoDB Configuration

- [ ] `.env` has `MONGODB_URI` set
- [ ] Test MongoDB connection:
  ```bash
  node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(err => console.log('❌ Failed:', err))"
  ```
- [ ] MongoDB accepts connections
- [ ] Database is accessible

---

## Phase 2: Frontend Setup

### Dependencies Verification

- [ ] Frontend dependencies already installed (no new ones needed)
- [ ] `axios` available
- [ ] `react-hot-toast` available

### Code Validation

- [ ] [useGuestSession.ts](frontend/hooks/useGuestSession.ts) created ✓
- [ ] [customer-app-new.tsx](frontend/components/demo/customer-app-new.tsx) updated with:
  - [ ] `import { useGuestSession }`
  - [ ] useGuestSession hook integrated
  - [ ] handleNameSubmit calls createGuestSession()
  - [ ] handleCheckout calls updateCartInSession()
  - [ ] Exit handlers call endGuestSession()

### Build Verification

- [ ] Run `npm run build` in frontend
- [ ] No TypeScript errors
- [ ] No build warnings (acceptable if not breaking)

---

## Phase 3: Local Testing

### Test 1: Server Startup

```bash
cd backend
npm run dev
```

- [ ] Server starts without errors
- [ ] Listening on port 5000 (or configured port)
- [ ] No MongoDB connection errors
- [ ] Routes registered:
  ```
  ✓ /api/auth
  ✓ /api/tables
  ✓ /api/orders
  ✓ /api/menus
  ✓ /api/payments
  ✓ /api/guest-session  ← NEW
  ```

### Test 2: Guest Session Creation

```bash
curl -X POST http://localhost:5000/api/guest-session/create \
  -H "Content-Type: application/json" \
  -d '{"tableNumber": 1, "customerName": "Test User"}'
```

- [ ] Returns status 201
- [ ] Response includes `sessionId`
- [ ] Response includes `session` object
- [ ] Check browser console: Cookie `guestSessionId` is set (if using browser)
- [ ] MongoDB shows new GuestSession document

### Test 3: Session Validation

```bash
# Replace SESSION_ID with actual sessionId from Test 2
curl http://localhost:5000/api/guest-session/validate/SESSION_ID
```

- [ ] Returns status 200
- [ ] Response has `"success": true`
- [ ] Session data returned
- [ ] lastActivityTime is updated

### Test 4: Update Cart

```bash
curl -X PUT http://localhost:5000/api/guest-session/SESSION_ID/cart \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "_id": "menu-1",
        "name": "Burger",
        "category": "Food",
        "price": 500,
        "image": "url",
        "quantity": 2
      }
    ],
    "totalAmount": 1000
  }'
```

- [ ] Returns status 200
- [ ] Cart updated in MongoDB
- [ ] Response shows updated session

### Test 5: End Session

```bash
curl -X POST http://localhost:5000/api/guest-session/SESSION_ID/end
```

- [ ] Returns status 200
- [ ] Response has `"success": true`
- [ ] Session marked `isActive: false` in MongoDB
- [ ] Cookie cleared (header shows `Max-Age=0`)

### Test 6: Frontend Integration

- [ ] Run `npm run dev` in frontend
- [ ] Navigate to guest ordering
- [ ] Scan QR code (or use test file upload)
- [ ] Enter customer name
- [ ] Verify session created (check Network tab)
- [ ] Browse menu
- [ ] Add items to cart
- [ ] Refresh page (F5)
- [ ] **Expected**: Cart restored, menu still shows ✓
- [ ] Proceed to checkout
- [ ] Order submitted with `sessionId` ✓

### Test 7: Session Persistence After Refresh

- [ ] During menu browsing, add items to cart
- [ ] Hard refresh (Ctrl+F5)
- [ ] **Expected**:
  - [ ] Page reloads
  - [ ] Session restored from localStorage
  - [ ] Cart items still visible
  - [ ] Can continue ordering

### Test 8: Session Expiration Simulation

- [ ] Create a session
- [ ] In MongoDB, manually set `expiresAt` to past date:
  ```javascript
  db.guestSessions.updateOne(
    { sessionId: "..." },
    { $set: { expiresAt: new Date("2020-01-01") } },
  );
  ```
- [ ] Try to validate session
- [ ] **Expected**:
  - [ ] Returns 401 "Session has expired"
  - [ ] Session marked `isActive: false`

---

## Phase 4: Production Environment Setup

### Environment Variables

Create `.env` with:

```bash
# Required
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_secret_key_here

# Optional
PORT=5000
SESSION_TIMEOUT=7200
```

- [ ] All required variables set
- [ ] Sensitive values not in version control
- [ ] `.env` file is in `.gitignore`

### Docker Setup (if applicable)

- [ ] [Docker](backend/Dockerfile) file includes:
  - [ ] `npm install` step
  - [ ] Correct Node.js version
  - [ ] PORT exposed
- [ ] [docker-compose.yml](docker-compose.yml) includes:
  - [ ] Backend service
  - [ ] Frontend service
  - [ ] MongoDB service (or remote URI)
  - [ ] Environment variables set

### HTTPS Configuration

- [ ] SSL certificate obtained (Let's Encrypt for free)
- [ ] HTTPS enabled on server
- [ ] Redirect HTTP → HTTPS
- [ ] `secure: true` in cookie settings (NODE_ENV=production)

### Security Headers

- [ ] CORS properly configured for production domain
- [ ] Origin whitelist set (no `*`)
- [ ] Example:
  ```typescript
  app.use(
    cors({
      origin: "https://yourdomain.com",
      credentials: true,
    }),
  );
  ```

---

## Phase 5: Database Verification

### MongoDB Indexes

Verify all required indexes exist:

```bash
# Connect to MongoDB
mongosh "mongodb+srv://..."

# List all indexes on guestSessions
db.guestSessions.getIndexes()
# Should show:
# - _id_
# - sessionId_1 (Unique)
# - tableNumber_1
# - expiresAt_1 (TTL)

# List all indexes on orders
db.orders.getIndexes()
# Should show:
# - _id_
# - tableNumber_1
# - sessionId_1
```

- [ ] All indexes present
- [ ] TTL index on guestSessions.expiresAt (expires: 0)
- [ ] sessionId index on both collections

### Data Integrity

- [ ] Sample GuestSession document structure valid:
  ```json
  {
    "_id": ObjectId(...),
    "sessionId": "string",
    "tableNumber": number,
    "customerName": "string",
    "customerId": "string",
    "cart": {
      "items": [...],
      "totalAmount": number
    },
    "sessionStartTime": ISODate(...),
    "lastActivityTime": ISODate(...),
    "isActive": boolean,
    "expiresAt": ISODate(...)
  }
  ```
- [ ] Sample Order document has sessionId field
- [ ] No corrupted documents

---

## Phase 6: Monitoring & Logging

### Server Logging

- [ ] Session creation logged: "New session created: sessionId"
- [ ] Session validation logged: "Session validated: sessionId"
- [ ] Session expiration logged: "Session expired: sessionId"
- [ ] Errors logged with context

### Monitoring Setup

- [ ] Response time monitoring enabled
- [ ] Database query performance monitored
- [ ] Error tracking setup (Sentry, DataDog, etc.)
- [ ] Database connection pool monitored

### Alerts Configured

- [ ] Alert on MongoDB connection failure
- [ ] Alert on high error rate (>5%)
- [ ] Alert on slow queries (>1s)
- [ ] Alert on disk space low

---

## Phase 7: Load Testing

### Basic Load Test

```bash
# Using Apache Bench or similar
ab -n 100 -c 10 http://localhost:5000/api/guest-session/validate/test-id
```

- [ ] Server handles concurrent requests
- [ ] No memory leaks
- [ ] Response time acceptable (<200ms)

### Database Load Test

- [ ] Create 1000+ sessions
- [ ] Query performance still acceptable
- [ ] TTL deletion runs in background without impact

---

## Phase 8: Backup & Recovery

### Database Backup

- [ ] MongoDB backup scheduled (daily)
- [ ] Backup location: Off-site (AWS S3, Google Cloud, etc.)
- [ ] Test restore procedure:
  - [ ] Can restore from backup
  - [ ] Data integrity verified after restore

### Application Backup

- [ ] Code backed up (GitHub, GitLab)
- [ ] Configuration backed up (encrypted)
- [ ] Disaster recovery plan documented

---

## Phase 9: Documentation & Handoff

### Documentation Complete

- [ ] [QUICK_SETUP.md](QUICK_SETUP.md) - ✓ Setup guide
- [ ] [GUEST_SESSION_GUIDE.md](GUEST_SESSION_GUIDE.md) - ✓ Full technical docs
- [ ] [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - ✓ What was built
- [ ] [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - ✓ System diagrams
- [ ] [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - ✓ This file

### Team Knowledge Transfer

- [ ] Team members read documentation
- [ ] Deploy process documented
- [ ] Troubleshooting procedures documented
- [ ] On-call support setup

### Version Control

- [ ] All code committed to Git
- [ ] Commit messages clear and descriptive
- [ ] No sensitive data in repo
- [ ] Tag release version (e.g., v1.0.0)

---

## Phase 10: Go Live

### Pre-Deployment Verification

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit completed
- [ ] Performance benchmarks met

### Deployment

- [ ] Backup current production
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Get approval to deploy to production
- [ ] Deploy to production during low-traffic time
- [ ] Monitor closely first 1 hour

### Post-Deployment

- [ ] Application accessible
- [ ] All endpoints responding
- [ ] Guest session flow working end-to-end
- [ ] No errors in logs
- [ ] Database performing well
- [ ] Monitoring showing normal metrics

### Rollback Plan

- [ ] Rollback procedure documented
- [ ] Can quickly revert if issues
- [ ] Previous version backed up
- [ ] Rollback communication plan ready

---

## Phase 11: Production Monitoring (First Week)

### Daily Checks

- [ ] Error logs reviewed
- [ ] Session creation/validation rates normal
- [ ] TTL cleanup working (documents deleted)
- [ ] Database performance acceptable
- [ ] CPU/Memory usage normal

### Weekly Review

- [ ] Session timeout appropriateness
  - [ ] Too many timeouts? Increase from 2h
  - [ ] Users complain? Increase to 3-4h
- [ ] Cart update frequency reasonable
- [ ] Order creation successful rate
- [ ] User feedback collected

---

## Final Sign-Off

**Before marking as complete, verify:**

- [ ] All backend files created/modified ✓
- [ ] All frontend files created/modified ✓
- [ ] Dependencies installed ✓
- [ ] Code compiles without errors ✓
- [ ] Local testing passed ✓
- [ ] Production environment configured ✓
- [ ] Database verified ✓
- [ ] Documentation complete ✓
- [ ] Team trained ✓
- [ ] Go-live successful ✓
- [ ] Post-deployment monitoring active ✓

---

## Deployment Command Reference

```bash
# Backend
cd backend
npm install
npm run build  # if using TypeScript
npm start      # Production mode

# Frontend
cd frontend
npm install
npm run build
npm run start   # Production mode

# Docker Deployment
docker-compose build
docker-compose up -d

# Monitoring
tail -f logs/server.log
```

---

## Contacts & Escalation

| Issue            | Contact         | Response Time |
| ---------------- | --------------- | ------------- |
| Database Down    | DBA Team        | 15 min        |
| Server Crash     | DevOps          | 10 min        |
| Deployment Issue | Deployment Team | 20 min        |
| Security Issue   | Security Team   | 5 min         |

---

**Deployment Status**: Ready for Production ✅  
**Last Updated**: January 25, 2026  
**Checked By**: [Your Name]  
**Date**: [Current Date]

---

## Quick Reference

**Key Files to Monitor**:

- `backend/src/models/GuestSession.model.ts` - Session schema
- `backend/src/controller/guestSession.controller.ts` - Session logic
- `frontend/hooks/useGuestSession.ts` - Frontend session management

**Key Endpoints**:

- `POST /api/guest-session/create` - Create session
- `GET /api/guest-session/validate/:id` - Validate session
- `PUT /api/guest-session/:id/cart` - Update cart

**Important Settings**:

- Session timeout: 2 hours (adjustable in controller)
- TTL index: Auto-deletes sessions after expiration
- HTTP-only cookie: Secure by default

**Troubleshooting Tips**:

1. Check MongoDB connection first
2. Verify cookies are enabled
3. Check sessionId format (should be "tableNum-uuid")
4. Look for TTL cleanup in logs

---

🎉 **You're ready to deploy! Good luck!**
