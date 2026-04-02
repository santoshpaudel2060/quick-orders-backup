# QR-Based Restaurant Ordering System

A modern, **mobile-first restaurant ordering system** built with React and Node.js, designed for Nepalese restaurants. Customers can **scan a QR code** to view the menu, place orders, and optionally pay online, all from their own mobile phones. Kitchen staff and admins can manage orders and menus in real-time.

---

## 📌 Features

### Customer / Guest

- Scan QR code on the table to start ordering
- Enter name and table number
- View restaurant menu
- Add/remove items to order
- See real-time order summary
- Optional online payment integration (eSewa)
- Guest session persists using browser storage to prevent data loss on refresh
- **🎯 NEW: Real-Time Order Tracking with Live Progress Bar**
  - Watch orders progress from pending → preparing → ready
  - Automatic status updates based on progress percentage
  - Live Socket.io updates every 2 seconds
  - No page refresh required

### Kitchen Dashboard

- View incoming orders in real-time
- Display table number and customer name
- Update order status: Pending → Cooking → Ready
- Simple, mobile-first design for phones

### Admin Dashboard

- Add / edit / remove menu items
- View all orders and transactions
- Track sales analytics
- Manage table numbers
- Mobile-friendly interface

---

## 🛠️ Tech Stack

**Frontend**

- React.js
- Tailwind CSS (for responsive and mobile-first UI)
- Socket.io (real-time updates)

**Backend**

- Node.js + Express.js
- MongoDB (cloud or local)
- REST API for managing menus, orders, and transactions
- Optional session management for guest users

**Payment (Optional)**

- eSewa API integration

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- MongoDB instance (local or cloud)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/santoshpaudel2060/quick-orders-backup
cd restaurant-qr-ordering
```

2. Install dependencies:

```bash
cd frontend
npm install
cd ../backend
npm install
```

3. Configure environment variables:

Create `.env` file in backend folder:

```
PORT=5000
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_secret_key>
NODE_ENV=development
```

4. Start the backend server:

```bash
cd backend
npm run dev
```

5. Start the frontend (in a new terminal):

```bash
cd frontend
npm run dev
```

6. Open browser and navigate to:

```
http://localhost:3000
```

---

## ⚡ Real-Time Order Tracking (NEW!)

The system now includes **automatic real-time order tracking** with live progress updates.

### How It Works

- When a customer places an order, it automatically starts tracking
- Progress increases from 0% → 100% automatically (every 2 seconds)
- Order status updates dynamically:
  - **0-10%**: Pending ⏳
  - **10-99%**: Preparing 👨‍🍳
  - **100%**: Ready ✅
- Customers can see live updates on the tracking page without refreshing
- All updates are powered by Socket.io

### Quick Test

1. Place an order at http://localhost:3000/customer
2. Click "Track Your Order Live 📍" after payment
3. Watch the progress bar update in real-time!

### Documentation

See [QUICK_START.md](QUICK_START.md) for a 5-minute quick start guide.

See [REALTIME_ORDER_TRACKING.md](REALTIME_ORDER_TRACKING.md) for detailed implementation guide and customization options.

---

🔹 Folder Structure
restaurant-qr-ordering/
├─ backend/
│ ├─ models/ # MongoDB models (Order, Menu, User/Admin)
│ ├─ routes/ # API routes
│ ├─ controllers/ # Route handlers
│ └─ server.js
├─ frontend/
│ ├─ components/ # React components
│ ├─ pages/ # Pages: Customer, Kitchen, Admin
│ └─ App.js
├─ README.md
└─ package.json
💡 How It Works
Customer scans the QR → browser opens menu page

Customer enters name → starts ordering

Items added to cart → stored in browser storage for persistence

Orders sent in real-time to kitchen dashboard using Socket.io

Admin can manage menus, see orders, and track sales

Customer completes order → optionally pays online

📌 Future Improvements
Multi-restaurant support

Enhanced analytics for admins

Push notifications for kitchen staff

Payment integration with multiple providers

Progressive Web App (PWA) for offline support

📝 Contributing
Fork the project

Create a new branch: git checkout -b feature-name

Make your changes

Commit your changes: git commit -m 'Add new feature'

Push to the branch: git push origin feature-name

Open a Pull Request

👤 Author
Santosh Paudel – GitHub – https://github.com/santoshpaudel2060

```

```
