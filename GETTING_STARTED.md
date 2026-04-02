# 🚀 Getting Started with Real-Time Order Tracking

## Installation & Setup (2 minutes)

### Prerequisites

- Node.js v18+
- MongoDB running (local or cloud)
- npm or yarn

### 1️⃣ Start Backend

```bash
cd backend
npm install        # Only needed first time
npm run dev
```

Expected output:

```
Server running on port 5000
Connected to MongoDB
```

### 2️⃣ Start Frontend (new terminal)

```bash
cd frontend
npm install        # Only needed first time
npm run dev
```

Expected output:

```
▲ Next.js 16.1.4
- Local:        http://localhost:3000
```

### 3️⃣ Open in Browser

Navigate to:

```
http://localhost:3000/customer
```

---

## Complete Test Flow

### Step 1: QR Scan

```
Page: http://localhost:3000/customer
┌─────────────────────────────────┐
│ QuickOrders                      │
│ Scan your table QR code          │
│                                 │
│ [Upload QR] [Open Camera]       │
└─────────────────────────────────┘

👉 Click "Open Camera to Scan"
```

### Step 2: Select Table

```
The app will ask for table number.
For testing, any number works (1-20).

💡 Mock tables are auto-generated in the app
```

### Step 3: Browse Menu

```
Page: http://localhost:3000/customer?stage=menu&table=5
┌─────────────────────────────────┐
│ Table 5          [🛒 0] [Back]  │
│                                 │
│ [Main] [Appetizer] [Dessert]    │
│                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────┐│
│ │Pizza    │ │Salad    │ │...  ││
│ │NPR 12.99│ │NPR 8.99 │ │     ││
│ │ +Cart   │ │ +Cart   │ │ +Cart││
│ └─────────┘ └─────────┘ └─────┘│
└─────────────────────────────────┘

👉 Add 2-3 items to cart
```

### Step 4: Review Cart

```
Page: http://localhost:3000/customer?stage=cart
┌─────────────────────────────────┐
│ Your Cart    [Continue] [Back]  │
│                                 │
│ Pizza x2        NPR 25.98       │
│ Salad x1        NPR 8.99        │
│                                 │
│                                 │
│            Order Summary         │
│ Subtotal:       NPR 34.97       │
│ Tax (10%):      NPR 3.50        │
│ Total:          NPR 38.47       │
│                                 │
│ [Order More] [Checkout]         │
└─────────────────────────────────┘

👉 Click "Checkout"
```

### Step 5: Payment

```
Page: http://localhost:3000/customer?stage=checkout
┌─────────────────────────────────┐
│ Order Confirmed      [Back]      │
│ Table 5                          │
│                                 │
│ [Order Items]                    │
│ Pizza x2  ...... NPR 25.98      │
│ Salad x1  ...... NPR 8.99       │
│                                 │
│ Total: NPR 38.47                │
│                                 │
│ [Scan to Pay]                   │
│ ┌────────────────┐              │
│ │  QR Code       │              │
│ │  Image here    │              │
│ │                │              │
│ └────────────────┘              │
│                                 │
│ [Payment Completed]             │
└─────────────────────────────────┘

👉 Click "Payment Completed"
```

### Step 6: Order Placed! 🎉

```
Page: http://localhost:3000/customer?stage=order-placed
┌─────────────────────────────────┐
│                                 │
│             ✅                  │
│                                 │
│    Order Confirmed!             │
│                                 │
│ Your order has been placed!     │
│ It's now being prepared!        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Table: 5                    │ │
│ │ Items: 2                    │ │
│ │ Total: NPR 38.47            │ │
│ │ Order ID: abc123xyz         │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Track Your Order Live 📍]       │
│ [Continue Ordering]             │
│ [Back to Home]                  │
└─────────────────────────────────┘

👉 Click "Track Your Order Live 📍"
```

### Step 7: Real-Time Tracking! 📊

```
Page: http://localhost:3000/order-tracking?table=5
┌──────────────────────────────────┐
│ Order Tracking                   │
│ Real-time updates of your orders │
│ 🟢 Connected                     │
│                                  │
│ ┌────────────────────────────────┐
│ │ Table 5                        │
│ │ Ordered at 2:15:34 PM          │
│ │ Total: NPR 38.47               │
│ │                                │
│ │ 👨‍🍳 PREPARING   36%             │
│ │ ████████░░░░░░░░░░░░          │
│ │     0%        50%       100%    │
│ │                                │
│ │ Items:                         │
│ │ • Pizza x2 ... NPR 25.98       │
│ │ • Salad x1 ... NPR 8.99        │
│ │                                │
│ │ Status: PREPARING ✓            │
│ └────────────────────────────────┘
│                                  │
│ 🔄 Refreshing every 2 seconds    │
│                                  │
│ [← Back to Menu]                 │
└──────────────────────────────────┘

⏳ Wait and watch the progress!

Time:   Progress:    Status:
0:02    3%          PENDING ⏳
0:04    6%          PENDING ⏳
0:08    12%         PREPARING 👨‍🍳
0:24    36%         PREPARING 👨‍🍳
0:48    72%         PREPARING 👨‍🍳
0:58    99%         PREPARING 👨‍🍳
1:00    100%        READY ✅
        Completed at 2:16:34 PM
```

**What's happening:**

- Backend: Incrementing progress by 3% every 2 seconds
- Socket.io: Sending updates to all connected clients
- Frontend: Updating progress bar in real-time
- No page refresh needed!

---

## Expected Behavior Timeline

```
0:00    Order created (progress: 0%)
        Status: pending ⏳ (yellow bar)

0:02    Progress: 3%
        Status: pending ⏳

0:04    Progress: 6%
        Status: pending ⏳

0:08    Progress: 12%
        Status: preparing 👨‍🍳 (bar turns blue)

0:12    Progress: 15%
        Status: preparing 👨‍🍳

0:24    Progress: 36%
        Status: preparing 👨‍🍳

0:36    Progress: 54%
        Status: preparing 👨‍🍳

0:48    Progress: 72%
        Status: preparing 👨‍🍳

0:58    Progress: 99%
        Status: preparing 👨‍🍳

1:00    Progress: 100% ✅
        Status: ready 🟢 (bar turns green)
        Completion time: 2:16:34 PM
        ✨ Order complete!
```

---

## Speed Up Testing (Optional)

To see orders complete in **10 seconds** instead of 1 minute:

### Edit Backend Config

File: `backend/src/controller/order.controller.ts` (around line 50)

**Before:**

```typescript
startOrderTracking(order._id.toString(), io, {
  progressIncrement: 3,
  updateInterval: 2000,
});
```

**After:**

```typescript
startOrderTracking(order._id.toString(), io, {
  progressIncrement: 10, // was 3
  updateInterval: 1000, // was 2000
});
```

**Restart backend:**

```bash
npm run dev  # Ctrl+C then restart
```

Now orders complete in ~10 seconds!

---

## Visual Progress States

### State 1: PENDING ⏳ (0-10%)

```
⏳ PENDING        0%
████░░░░░░░░░░░░░░░░
```

Color: Yellow/Amber

### State 2: PREPARING 👨‍🍳 (10-99%)

```
👨‍🍳 PREPARING     36%
██████████░░░░░░░░░░
```

Color: Blue

### State 3: READY ✅ (100%)

```
✅ READY         100%
████████████████████
Completed at 2:16:34 PM
```

Color: Green

---

## What's Working

- ✅ Order creation with progress: 0
- ✅ Auto-progress increment every 2 seconds
- ✅ Status transitions at correct thresholds
- ✅ Socket.io broadcasts to all clients
- ✅ Frontend receives and displays updates
- ✅ Progress bar color changes
- ✅ Smooth animations
- ✅ Completion timestamp recorded
- ✅ No page refresh needed
- ✅ Multiple orders work simultaneously

---

## Troubleshooting

### "Can't connect to backend"

```
Error: ECONNREFUSED 127.0.0.1:5000

✅ Solution: Make sure backend is running
cd backend
npm run dev
```

### "Socket.io is disconnected"

```
Red dot showing "Connecting..."

✅ Solutions:
1. Check backend is running
2. Check NEXT_PUBLIC_API_URL env variable
3. Refresh page
4. Check browser console for errors
```

### "Progress bar not updating"

```
Stuck at 0%

✅ Solutions:
1. Check backend logs for "Starting tracking..." message
2. Verify Socket.io connection (red vs green dot)
3. Open DevTools Network tab → check WebSocket
4. Try placing a new order
```

### "Order not created"

```
API error when clicking "Payment Completed"

✅ Solutions:
1. Check backend is running on port 5000
2. Check browser console for API error
3. Verify API_URL is correct
4. Check backend logs for errors
```

---

## Customization Examples

### Example 1: 5-Second Orders

```typescript
// backend/src/controller/order.controller.ts
startOrderTracking(order._id.toString(), io, {
  progressIncrement: 20, // 20% per update
  updateInterval: 1000, // Every 1 second
  // Order completes in 5 seconds: 20% x 5 = 100%
});
```

### Example 2: Very Slow Orders (5 minutes)

```typescript
startOrderTracking(order._id.toString(), io, {
  progressIncrement: 0.33, // 0.33% per update
  updateInterval: 1000, // Every 1 second
  // Order completes in 300 seconds: 0.33% x 300 = 100%
});
```

### Example 3: Change Status Thresholds

```typescript
// backend/src/services/orderTracking.service.ts
export const getStatusByProgress = (progress: number) => {
  if (progress >= 100) return "ready";
  if (progress >= 50) return "preparing"; // Changed from 10
  return "pending"; // Much longer pending phase
};
```

---

## Architecture Overview

```
Browser (Frontend)              Localhost:3000
  │
  ├─ Customer App (place order)
  │     ↓
  └─ Order Tracking Page (live updates)
        ↓
        └─ Socket.io WebSocket connection
              ↓ receives "order-progress" events
              ↓ every 2 seconds

Server (Backend)                Localhost:5000
  │
  ├─ Order API (POST /api/orders/add)
  │     ↓
  │     └─ startOrderTracking(orderId, io)
  │           ↓
  │           └─ Interval Loop (every 2 seconds)
  │                 1. progress += 3%
  │                 2. status = getStatusBy...()
  │                 3. update DB
  │                 4. emit Socket.io event
  │
  └─ Socket.io Server
        ↓ broadcasts events to all clients
```

---

## Monitor in Browser DevTools

### Open DevTools (F12)

**Console Tab:**

```
Should see:
"Connected to order tracking socket: abc123xyz"
```

**Network Tab:**

1. Filter by "WS" (WebSocket)
2. Look for Socket.io connection
3. Should show `wss://localhost:5000/socket.io/?...`
4. Status: 101 Switching Protocols (✅ connected)

**Messages Sub-tab:**

1. Click the Socket.io connection
2. Scroll to Messages
3. Watch for events coming in:

```
←  2:1 {"type":2,"nsp":"/","data":["order-progress",{...}]}
←  2:1 {"type":2,"nsp":"/","data":["order-progress",{...}]}
```

---

## File Locations for Reference

**Backend files:**

- Service: `backend/src/services/orderTracking.service.ts`
- Controller: `backend/src/controller/order.controller.ts`
- Model: `backend/src/models/Order.model.ts`

**Frontend files:**

- Hook: `frontend/hooks/useOrderTracking.ts`
- Components: `frontend/components/OrderProgressBar.tsx`
- Components: `frontend/components/OrderTrackingCard.tsx`
- Page: `frontend/app/order-tracking/page.tsx`
- App: `frontend/components/dashboard/customer-app.tsx`

---

## Summary Checklist

- [ ] Backend running on localhost:5000
- [ ] Frontend running on localhost:3000
- [ ] Opened http://localhost:3000/customer
- [ ] Scanned/uploaded QR code
- [ ] Added items to cart
- [ ] Clicked "Checkout" → "Payment Completed"
- [ ] Clicked "Track Your Order Live 📍"
- [ ] Watched progress bar update
- [ ] Saw status change from yellow → blue → green
- [ ] Order reached 100% and showed completion time

✨ **All done! You've successfully tested real-time order tracking!** ✨

---

**Questions?** Check:

- QUICK_START.md - Fast setup
- REALTIME_ORDER_TRACKING.md - Detailed docs
- IMPLEMENTATION_SUMMARY.md - What was built

Happy ordering! 🍕🎉
