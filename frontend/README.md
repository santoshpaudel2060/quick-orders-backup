# QuickOrders - Hotel QR Ordering System (Frontend Only)

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/santoshppaudel098-gmailcoms-projects/v0-hotel-ordering-system)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/jnrQvbzBS1d)

## Overview

A complete frontend-only demo of a hotel table ordering system built with Next.js and React. This is a fully functional single-page application with no backend dependencies. All features work entirely in the browser using React state and mock data.

## Features

### Customer App
- Scan table QR code to access menu
- Browse menu items by categories (Main Course, Appetizer, Dessert, Beverage)
- Add items to cart with quantity control
- View order summary with calculated totals
- Complete checkout process
- Generate digital invoice with payment option

### Kitchen Dashboard
- Real-time order display with table numbers
- Track order status: Pending → Preparing → Ready
- Visual indicators (color-coded badges and emojis)
- Action buttons to update order status
- Time tracking for each order
- Summary statistics (Pending, Preparing, Ready counts)

### Admin Panel
- **Overview Tab**: Order analytics, table status overview
- **Menu Tab**: Add new menu items with categories and prices, view all items
- **Tables Tab**: Create multiple tables, manage table status, QR codes per table
- **Settings Tab**: Restaurant configuration (name, address, tax rate, service charge)

## How It Works

1. **Customer Flow**
   - Scan QR code from table
   - Browse menu by category
   - Add items to cart
   - Proceed to checkout
   - View invoice and payment options

2. **Kitchen Flow**
   - View pending orders
   - Accept and start preparing
   - Mark as ready when complete
   - Remove from queue once served

3. **Admin Flow**
   - Manage menu items
   - Create and configure tables
   - View real-time analytics
   - Adjust restaurant settings

## Technology Stack

- **Framework**: Next.js 16 with React 19
- **UI Components**: shadcn/ui (pre-configured)
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks with local state
- **Storage**: Browser state (can be extended with localStorage)

## Project Structure

\`\`\`
app/
├── layout.tsx                # Root layout
├── page.tsx                 # Home page with demo navigation
└── globals.css              # Global styles

components/
├── demo/
│   ├── customer-app.tsx     # Customer menu & ordering
│   ├── kitchen-dashboard.tsx # Kitchen order management
│   └── admin-panel.tsx      # Admin configuration
└── ui/                      # shadcn/ui components
\`\`\`

## Running the Project

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open http://localhost:3000 in browser
4. Click on any of the three demo buttons to explore

## Key Features

✓ Real-time order status updates using React state
✓ Multiple user role simulations (Customer, Kitchen, Admin)
✓ Complete order workflow from menu to billing
✓ QR code identification for table access
✓ Digital invoice generation
✓ Mock data that simulates real backend responses
✓ Fully responsive design (mobile & desktop)
✓ No backend required - works entirely in browser

## Mock Data

The application uses hardcoded mock data to simulate:
- Menu items with categories and prices
- Restaurant tables with QR codes
- Order management with status tracking
- Customer orders and invoices
- Analytics and reporting

## Deployment

Your project is live at:

**[https://vercel.com/santoshppaudel098-gmailcoms-projects/v0-hotel-ordering-system](https://vercel.com/santoshppaudel098-gmailcoms-projects/v0-hotel-ordering-system)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/jnrQvbzBS1d](https://v0.app/chat/jnrQvbzBS1d)**

## Next Steps for Production

To convert this to a full MERN application:
1. Set up Express backend with MongoDB
2. Create REST API endpoints for all operations
3. Replace mock data with API calls
4. Implement WebSocket for real-time updates
5. Add authentication and authorization
6. Deploy backend and frontend separately

---

Built with v0.app - Hotel QR Ordering System Demo (Frontend Only)
