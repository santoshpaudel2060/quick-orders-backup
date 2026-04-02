# Frontend Order Tracking Algorithm - Usage Map 🗺️

## Architecture Overview

```
Customer Flow:
QR Scan (customer-app.tsx)
    ↓
Order Placement (customer-app.tsx)
    ↓
"Track Your Order Live" Button
    ↓
Order Tracking Page (/order-tracking)
    ↓
Real-Time Progress Updates (Socket.io + Polling)
```

---

## Core Components & Where They're Used

### 1. **useOrderTracking Hook** 📡

**Location**: [frontend/hooks/useOrderTracking.ts](frontend/hooks/useOrderTracking.ts)

**Purpose**: Socket.io connection and order progress state management

**Used In**:

- ✅ [OrderTrackingCard.tsx](frontend/components/OrderTrackingCard.tsx) - Line 2
  ```typescript
  import { useOrderTracking } from "../hooks/useOrderTracking";
  ```
- ✅ [order-tracking/page.tsx](frontend/app/order-tracking/page.tsx) - Line 4
  ```typescript
  import { useOrderTracking } from "../../hooks/useOrderTracking";
  ```

**Features**:

- Establishes Socket.io connection to `NEXT_PUBLIC_API_URL`
- Listens for events: `order-progress`, `order-completed`, `new-order`
- Maintains Map of active orders with progress (0-100%)
- Provides methods: `subscribeToOrder()`, `unsubscribeFromOrder()`, `getOrderProgress()`
- Returns: `{ socket, orderProgress, isConnected, subscribeToOrder, unsubscribeFromOrder, getOrderProgress }`

---

### 2. **OrderProgressBar Component** 🎨

**Location**: [frontend/components/OrderProgressBar.tsx](frontend/components/OrderProgressBar.tsx)

**Purpose**: Animated progress bar UI with percentage display

**Used In**:

- ✅ [OrderTrackingCard.tsx](frontend/components/OrderTrackingCard.tsx) - Lines 124, 162
  ```typescript
  <OrderProgressBar
    progress={progress}
    status={status as any}
    size="sm|md"
    showPercentage={true}
    showStatus={true}
    completedAt={completedAt}
  />
  ```

**Features**:

- Displays progress 0-100% with animated bar
- Color-coded by status:
  - **Yellow** (⏳ Pending): 0-10%
  - **Blue** (👨‍🍳 Preparing): 10-99%
  - **Green** (✅ Ready): 100%
- 500ms smooth transitions
- Shows milestone markers (0%, 50%, 100%)
- Optional completion timestamp display

---

### 3. **OrderTrackingCard Component** 📦

**Location**: [frontend/components/OrderTrackingCard.tsx](frontend/components/OrderTrackingCard.tsx)

**Purpose**: Full order card with embedded progress bar and polling fallback

**Used In**:

- ✅ [order-tracking/page.tsx](frontend/app/order-tracking/page.tsx) - Line 156
  ```typescript
  <OrderTrackingCard
    key={order._id}
    order={order}
    showDetails={true}
    compact={false}
  />
  ```

**Features**:

- Uses `useOrderTracking` hook (Line 37)
- Displays order header (table #, timestamp, total amount)
- Renders `OrderProgressBar` component
- Shows order items breakdown
- Displays status badge
- **Polling fallback**: Fetches fresh data every 3 seconds from `/api/orders/table/{tableNumber}`
- Debug logging: "💾 Updating progress", "🔄 Polling fresh data"

---

### 4. **Order Tracking Page** 📍

**Location**: [frontend/app/order-tracking/page.tsx](frontend/app/order-tracking/page.tsx)

**Purpose**: Main dashboard for live order tracking

**Usage Flow**:

1. Gets table number from URL params or localStorage
2. Fetches orders via `GET /api/orders/table/{tableNumber}` (Lines 60-70)
3. Uses `useOrderTracking` hook (Line 24)
4. Renders `OrderTrackingCard` for each order (Line 156)
5. Shows connection status indicator (Lines 123-130)

**Features**:

- Real-time status: "Connected" / "Connecting..." indicator
- Automatic order fetching and subscription
- 30-second refresh interval
- Debug logs: "Fetching orders from:", "Fetched orders:", "Subscribing to order:"
- Responsive grid layout (1 column mobile, 2 columns desktop)
- Back to menu button

**Access URL**:

```
http://localhost:3000/order-tracking?table=5
http://localhost:3000/order-tracking?session={sessionId}
```

---

### 5. **Customer App** 🛒

**Location**: [frontend/components/dashboard/customer-app.tsx](frontend/components/dashboard/customer-app.tsx)

**Purpose**: Customer ordering interface - entry point to tracking

**Integration Points**:

- ✅ Line 168: Saves table number to localStorage when QR scanned

  ```typescript
  localStorage.setItem("tableNumber", tableNum.toString());
  ```

- ✅ Line 307: Saves table number when QR uploaded via photo

  ```typescript
  localStorage.setItem("tableNumber", tableNum.toString());
  ```

- ✅ Line 850-853: Links to tracking page after order placement
  ```typescript
  href={`/order-tracking?table=${tableNumber}${sessionId ? `&session=${sessionId}` : ""}`}
  <span>Track Your Order Live 📍</span>
  ```

**Order Placement Flow** (Line 232):

```
1. Customer scans QR → Table # saved to localStorage
2. Customer selects items from menu
3. Customer clicks "Checkout"
4. POST /api/orders/add submitted
5. Order confirmed → "order-placed" stage
6. "Track Your Order Live 📍" button appears
7. Click → Navigate to /order-tracking?table={X}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  customer-app.tsx (Order Placement)                  │  │
│  │  ├─ QR Scan → localStorage.setItem("tableNumber")    │  │
│  │  ├─ POST /api/orders/add                            │  │
│  │  └─ Link: /order-tracking?table={X}                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  order-tracking/page.tsx (Tracking Page)            │  │
│  │  ├─ GET /api/orders/table/{tableNumber}             │  │
│  │  ├─ Renders OrderTrackingCard x N                   │  │
│  │  └─ Uses useOrderTracking hook                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OrderTrackingCard.tsx (Order Display)              │  │
│  │  ├─ subscribeToOrder(orderId)                       │  │
│  │  ├─ Renders OrderProgressBar                        │  │
│  │  └─ Polling: GET /api/orders/table/{} every 3s     │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OrderProgressBar.tsx (Progress Visualization)      │  │
│  │  ├─ Displays: progress 0-100%                       │  │
│  │  ├─ Colors: Yellow→Blue→Green                       │  │
│  │  └─ Status: Pending→Preparing→Ready                │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useOrderTracking Hook (State Management)           │  │
│  │  ├─ Socket.io: Listen for order-progress events     │  │
│  │  ├─ Map<orderId, OrderProgress>                     │  │
│  │  └─ Methods: getOrderProgress(), subscribe()        │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
         ┌──────────────────────────────────┐
         │       Socket.io Events           │
         │  - order-progress (every 2s)     │
         │  - order-completed               │
         │  - new-order                     │
         └──────────────────────────────────┘
                        ↓
         ┌──────────────────────────────────┐
         │         BACKEND                  │
         │  orderTracking.service.ts        │
         │  - Auto-increment progress       │
         │  - Broadcast via Socket.io       │
         └──────────────────────────────────┘
```

---

## Update Mechanisms (Dual Channel)

### Channel 1: Real-Time Socket.io 📡

```typescript
// In useOrderTracking hook
newSocket.on("order-progress", (data: OrderProgress) => {
  console.log("📊 Order progress received:", data);
  setOrderProgress((prev) => {
    const updated = new Map(prev);
    updated.set(data.orderId, data); // Update Map
    return updated;
  });
});
```

**Trigger**:

- Backend emits every 2 seconds
- OrderTrackingCard depends on `orderProgress` Map
- Component re-renders automatically

### Channel 2: Polling Fallback ⏱️

```typescript
// In OrderTrackingCard.tsx (3-second interval)
const pollInterval = setInterval(async () => {
  const response = await axios.get(`/api/orders/table/${order.tableNumber}`);
  const freshOrder = orders.find((o) => o._id === order._id);
  if (freshOrder) {
    setProgress(freshOrder.progress || 0); // Update state
    setStatus(freshOrder.status);
    setCompletedAt(freshOrder.completedAt);
  }
}, 3000);
```

**Trigger**:

- Fetches every 3 seconds as backup
- Ensures updates even if Socket.io events miss
- Independent state updates

---

## Dependencies & Imports

### OrderTrackingCard.tsx

```typescript
import React, { useEffect, useState } from "react";
import { useOrderTracking } from "../hooks/useOrderTracking";
import OrderProgressBar from "./OrderProgressBar";
import axios from "axios";
```

### order-tracking/page.tsx

```typescript
import { useOrderTracking } from "../../hooks/useOrderTracking";
import OrderTrackingCard from "../../components/OrderTrackingCard";
import axios from "axios";
```

### useOrderTracking.ts

```typescript
import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
```

---

## Key Variables & State

| Variable        | Component                    | Type                                | Purpose                     |
| --------------- | ---------------------------- | ----------------------------------- | --------------------------- |
| `tableNumber`   | customer-app, order-tracking | number                              | Identifies customer's table |
| `sessionId`     | customer-app, order-tracking | string                              | Fallback guest session ID   |
| `progress`      | OrderTrackingCard            | 0-100                               | Order completion percentage |
| `status`        | OrderTrackingCard            | "pending" \| "preparing" \| "ready" | Current order status        |
| `orderProgress` | useOrderTracking             | Map                                 | All active orders' progress |
| `isConnected`   | order-tracking               | boolean                             | Socket.io connection state  |
| `completedAt`   | OrderTrackingCard            | Date                                | Order completion timestamp  |

---

## Browser Console Debug Logs

When testing, watch for these logs:

```
✅ Connected to order tracking socket: [socket-id]
✅ Fetching orders from: http://localhost:5000/api/orders/table/5
✅ Fetched orders: [...]
✅ Subscribing to order: [order-id]
✅ 📊 Order progress received: {orderId, progress, status}
✅ 💾 Updating progress for order [id]: {progress, status}
✅ 🔄 Polling fresh data for order [id]: {...}
```

---

## Summary

The tracking algorithm is distributed across **5 main files**:

1. **useOrderTracking.ts** - Hook for Socket.io & state
2. **OrderProgressBar.tsx** - Visual progress component
3. **OrderTrackingCard.tsx** - Complete order card with polling
4. **order-tracking/page.tsx** - Main tracking dashboard
5. **customer-app.tsx** - Entry point & link to tracking

All connected by **dual update channels**:

- ⚡ Real-time: Socket.io events every 2 seconds
- 🔄 Fallback: API polling every 3 seconds

This ensures **zero missed updates** and **100% reliable progress display**! ✅
