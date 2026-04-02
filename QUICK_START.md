# Quick Start: Real-Time Order Tracking

## 🚀 Quick Setup (5 minutes)

### 1. Backend Setup

```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
```

### 2. Frontend Setup (new terminal)

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. Test It

1. Open http://localhost:3000/customer
2. Click "Open Camera to Scan"
3. Any of the mock QR codes will work (they're all valid)
4. Add items to cart (e.g., Pizza, Salad)
5. Click "Checkout" → "Payment Completed"
6. Click "Track Your Order Live 📍" button
7. Watch the progress bar update in real-time! 📊

---

## 🎯 What's New

### Order Tracking Features

- ✅ **Automatic Progress**: Orders progress 0→100% automatically
- ✅ **Status Updates**: pending → preparing → ready
- ✅ **Real-Time Sync**: Socket.io pushes updates every 2 seconds
- ✅ **No Refresh Needed**: All updates live without page reload
- ✅ **Completion Time**: Records when order reaches 100%

### New Components

- `OrderProgressBar` - Beautiful animated progress bar
- `OrderTrackingCard` - Full order card with progress
- `/order-tracking` page - Dedicated tracking dashboard
- `useOrderTracking` hook - Socket.io integration

### New API

- `POST /api/orders/add` - Enhanced to auto-start tracking
- Returns order with `progress: 0` and `status: pending`

---

## ⚙️ Customization

### Speed Up Testing (10 seconds instead of 1 minute)

Edit `backend/src/controller/order.controller.ts` - line ~50:

```typescript
// Change this:
startOrderTracking(order._id.toString(), io, {
  progressIncrement: 3, // ← Change to 10
  updateInterval: 2000, // ← Change to 1000 (1 second)
});
```

### Change Status Thresholds

Edit `backend/src/services/orderTracking.service.ts`:

```typescript
export const getStatusByProgress = (progress: number) => {
  if (progress >= 100) return "ready";
  if (progress >= 20) return "preparing"; // ← Change from 10
  return "pending";
};
```

---

## 📊 Real-Time Dashboard

Access from order confirmation page or directly:

```
http://localhost:3000/order-tracking?table=1
```

Shows:

- All orders for a table
- Live progress bars
- Current status
- Completion timestamps
- Connection status indicator

---

## 🔧 Architecture at a Glance

```
Customer places order
        ↓
Backend creates order (progress: 0)
        ↓
startOrderTracking() starts 2-second interval
        ↓
Every 2 seconds:
  - Increment progress by 3%
  - Update status based on progress
  - Emit Socket.io event
        ↓
Frontend receives event
        ↓
Update progress bar in real-time
        ↓
When progress reaches 100%
        ↓
Set status to "ready"
        ↓
Record completedAt timestamp
        ↓
Stop interval
```

---

## 📁 Files Changed

### Backend

```
src/models/Order.model.ts           (+progress field)
src/controller/order.controller.ts  (import tracking service)
src/services/orderTracking.service.ts (NEW - core logic)
```

### Frontend

```
hooks/useOrderTracking.ts           (NEW - Socket.io hook)
components/OrderProgressBar.tsx     (NEW - progress bar UI)
components/OrderTrackingCard.tsx    (NEW - order card UI)
app/order-tracking/page.tsx         (NEW - tracking page)
components/dashboard/customer-app.tsx (modified - add place order flow)
```

---

## 🐛 Troubleshooting

**Progress bar not updating?**

- Check browser console for errors
- Verify Socket.io connection (green dot on page)
- Check backend logs for "Starting tracking..." message

**Order not created?**

- Ensure backend is running on port 5000
- Check NEXT_PUBLIC_API_URL in frontend

**Connection failing?**

- Make sure both backend and frontend are running
- Check browser Network tab → WebSocket connection

---

## 📈 What Happens Behind the Scenes

1. **Order Created**
   - Progress set to 0%
   - Status set to "pending"
   - Tracking starts immediately

2. **Tracking Loop (every 2 seconds)**
   - Progress increases by 3%
   - If progress ≥ 10%: status → "preparing"
   - If progress ≥ 100%: status → "ready"
   - Socket.io emits "order-progress" event
   - Database updates with new progress/status

3. **Frontend Updates**
   - Listens to Socket.io events
   - Updates state immediately
   - Progress bar animates smoothly
   - Status colors change dynamically

4. **Order Complete**
   - Progress reaches 100%
   - Status becomes "ready"
   - completedAt timestamp set
   - Tracking stops
   - "order-completed" event emitted

---

## 🎨 Visual States

```
Progress Bar Colors:
0-10%   → Yellow (pending) ⏳
10-99%  → Blue (preparing) 👨‍🍳
100%    → Green (ready) ✅
```

---

## 💡 Example Workflow

```
Time: 0:00
├─ Customer: Clicks "Payment Completed"
├─ Backend: Creates order (progress: 0%, status: pending)
└─ Socket.io: Emits order-progress event

Time: 0:02
├─ Progress: 3%
└─ Status: pending ⏳

Time: 0:04
├─ Progress: 6%
└─ Status: pending ⏳

...

Time: 0:24
├─ Progress: 36%
└─ Status: preparing 👨‍🍳

...

Time: 1:00
├─ Progress: 100%
├─ Status: ready ✅
├─ completedAt: recorded
└─ Tracking: stopped
```

---

## 🚀 Next Enhancements

- Kitchen display system (view orders in real-time)
- Push notifications when ready
- Estimated completion time
- Admin dashboard to manage orders
- Email/SMS notifications
- Order history

---

## ✨ You're All Set!

Everything is ready to test. Just run:

```bash
npm run dev  # in backend folder
npm run dev  # in frontend folder (separate terminal)
```

Then open http://localhost:3000/customer and place an order! 🎉
