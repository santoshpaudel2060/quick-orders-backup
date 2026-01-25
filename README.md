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
Install dependencies:

cd frontend
npm install
cd ../backend
npm install
Configure environment variables:

Create .env file in backend folder:

PORT=5000
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_secret_key>
Start the backend server:

cd backend
npm run dev
Start the frontend:

cd frontend
npm start
Open browser and navigate to:

http://localhost:3000
🔹 Folder Structure
restaurant-qr-ordering/
├─ backend/
│  ├─ models/       # MongoDB models (Order, Menu, User/Admin)
│  ├─ routes/       # API routes
│  ├─ controllers/  # Route handlers
│  └─ server.js
├─ frontend/
│  ├─ components/   # React components
│  ├─ pages/        # Pages: Customer, Kitchen, Admin
│  └─ App.js
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
