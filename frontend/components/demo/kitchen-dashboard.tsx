// "use client";

// import { useState, useEffect } from "react";
// import axios from "axios";

// interface OrderItem {
//   name: string;
//   qty: number;
//   price: number;
// }

// interface Order {
//   _id: string;
//   tableNumber: number;
//   customerId: string;
//   items: OrderItem[];
//   status: "pending" | "preparing" | "ready" | "served";
//   totalAmount: number;
//   createdAt: string;
//   updatedAt: string;
// }

// export default function KitchenDashboard({ onBack }: { onBack?: () => void }) {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
//     null
//   );

//   // Fetch orders from backend (only active orders: pending, preparing, ready)
//   const fetchOrders = async () => {
//     try {
//       const response = await axios.get("http://localhost:5000/api/orders");

//       // Filter out served orders - kitchen only sees pending, preparing, and ready
//       const activeOrders = response.data.filter(
//         (order: Order) => order.status !== "served"
//       );

//       setOrders(activeOrders);
//       setError(null);
//     } catch (err: any) {
//       console.error("Failed to fetch orders:", err);
//       setError(
//         err.response?.data?.message ||
//           "Failed to fetch orders. Please check your connection."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initial fetch and setup auto-refresh
//   useEffect(() => {
//     fetchOrders();

//     // Auto-refresh every 5 seconds
//     const interval = setInterval(() => {
//       fetchOrders();
//     }, 5000);

//     setRefreshInterval(interval);

//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, []);

//   // Update order status with optimistic UI update
//   const updateOrderStatus = async (
//     orderId: string,
//     newStatus: "pending" | "preparing" | "ready" | "served"
//   ) => {
//     // Store the original state for rollback if needed
//     const originalOrders = [...orders];

//     try {
//       // Optimistic update - update UI immediately
//       if (newStatus === "served") {
//         // Remove from UI immediately when marked as served
//         setOrders(orders.filter((o) => o._id !== orderId));
//       } else {
//         // Update status in UI immediately
//         setOrders(
//           orders.map((o) =>
//             o._id === orderId ? { ...o, status: newStatus } : o
//           )
//         );
//       }

//       // Make API call
//       const response = await axios.put(
//         `http://localhost:5000/api/orders/${orderId}/status`,
//         {
//           status: newStatus,
//         }
//       );

//       console.log("Status updated successfully:", response.data);

//       // Fetch fresh data to ensure consistency
//       await fetchOrders();
//     } catch (err: any) {
//       console.error("Failed to update order status:", err);
//       console.error("Error details:", err.response?.data);

//       // Rollback to original state on error
//       setOrders(originalOrders);

//       const errorMessage =
//         err.response?.data?.message ||
//         "Failed to update order status. Please try again.";
//       alert(`Error: ${errorMessage}`);
//     }
//   };

//   // Remove/Complete order (for cancellations)
//   const completeOrder = async (orderId: string) => {
//     const originalOrders = [...orders];

//     try {
//       // Optimistic update
//       setOrders(orders.filter((o) => o._id !== orderId));

//       // Make API call
//       await axios.delete(`http://localhost:5000/api/orders/${orderId}`);

//       console.log("Order deleted successfully");

//       // Fetch fresh data
//       await fetchOrders();
//     } catch (err: any) {
//       console.error("Failed to complete order:", err);

//       // Rollback on error
//       setOrders(originalOrders);

//       const errorMessage =
//         err.response?.data?.message ||
//         "Failed to complete order. Please try again.";
//       alert(`Error: ${errorMessage}`);
//     }
//   };

//   // Calculate counts by status (only active orders)
//   const pendingCount = orders.filter((o) => o.status === "pending").length;
//   const preparingCount = orders.filter((o) => o.status === "preparing").length;
//   const readyCount = orders.filter((o) => o.status === "ready").length;

//   // Sort orders by priority (pending first, then preparing, then ready)
//   const sortedOrders = [...orders].sort((a, b) => {
//     const priorityMap = { pending: 0, preparing: 1, ready: 2, served: 3 };
//     if (priorityMap[a.status] !== priorityMap[b.status]) {
//       return priorityMap[a.status] - priorityMap[b.status];
//     }
//     // If same status, sort by creation time (oldest first)
//     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
//   });

//   // Format timestamp
//   const formatTime = (timestamp: string) => {
//     const date = new Date(timestamp);
//     return date.toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // Calculate time elapsed
//   const getTimeElapsed = (timestamp: string) => {
//     const now = new Date().getTime();
//     const orderTime = new Date(timestamp).getTime();
//     const diffMinutes = Math.floor((now - orderTime) / 60000);

//     if (diffMinutes < 1) return "Just now";
//     if (diffMinutes === 1) return "1 min ago";
//     return `${diffMinutes} mins ago`;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-8xl mb-6 animate-spin">👨‍🍳</div>
//           <p className="text-3xl font-black text-white mb-4">
//             Loading Kitchen Dashboard...
//           </p>
//           <p className="text-slate-400 font-semibold">
//             Fetching live orders from the system
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//       {/* Header */}
//       <div className="sticky top-0 z-40 backdrop-blur-lg bg-slate-900/80 border-b border-slate-700/50">
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <div className="flex justify-between items-center mb-8">
//             <div className="flex items-center gap-4">
//               <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-4xl shadow-lg animate-pulse">
//                 👨‍🍳
//               </div>
//               <div>
//                 <p className="text-xs font-black text-orange-400 uppercase tracking-widest">
//                   Live Operations
//                 </p>
//                 <h1 className="text-5xl font-black text-white">
//                   Kitchen Dashboard
//                 </h1>
//               </div>
//             </div>
//             <div className="flex gap-4 items-center">
//               <button
//                 onClick={fetchOrders}
//                 className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl text-base flex items-center gap-2"
//               >
//                 🔄 Refresh
//               </button>
//               {onBack && (
//                 <button
//                   onClick={onBack}
//                   className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl text-base"
//                 >
//                   ← Back
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
//               <p className="text-red-300 font-bold">⚠️ {error}</p>
//             </div>
//           )}

//           {/* Stats Cards */}
//           <div className="grid grid-cols-3 gap-4">
//             {/* Pending Orders */}
//             <div className="bg-gradient-to-br from-red-600/20 to-red-700/10 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm hover:from-red-600/30 hover:to-red-700/20 transition-all cursor-pointer">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs font-black text-red-300 uppercase tracking-wider mb-2">
//                     Pending Orders
//                   </p>
//                   <p className="text-5xl font-black text-red-400">
//                     {pendingCount}
//                   </p>
//                 </div>
//                 <div className="w-14 h-14 bg-red-500/20 rounded-lg flex items-center justify-center text-3xl">
//                   ⏱️
//                 </div>
//               </div>
//               <p className="text-red-300 text-xs mt-3 font-semibold">
//                 Waiting to start
//               </p>
//             </div>

//             {/* Preparing Orders */}
//             <div className="bg-gradient-to-br from-amber-600/20 to-amber-700/10 border border-amber-500/30 rounded-xl p-6 backdrop-blur-sm hover:from-amber-600/30 hover:to-amber-700/20 transition-all cursor-pointer">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
//                     Cooking Now
//                   </p>
//                   <p className="text-5xl font-black text-amber-400">
//                     {preparingCount}
//                   </p>
//                 </div>
//                 <div className="w-14 h-14 bg-amber-500/20 rounded-lg flex items-center justify-center text-3xl">
//                   🍳
//                 </div>
//               </div>
//               <p className="text-amber-300 text-xs mt-3 font-semibold">
//                 In progress
//               </p>
//             </div>

//             {/* Ready Orders */}
//             <div className="bg-gradient-to-br from-green-600/20 to-green-700/10 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm hover:from-green-600/30 hover:to-green-700/20 transition-all cursor-pointer">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs font-black text-green-300 uppercase tracking-wider mb-2">
//                     Ready to Serve
//                   </p>
//                   <p className="text-5xl font-black text-green-400">
//                     {readyCount}
//                   </p>
//                 </div>
//                 <div className="w-14 h-14 bg-green-500/20 rounded-lg flex items-center justify-center text-3xl">
//                   ✓
//                 </div>
//               </div>
//               <p className="text-green-300 text-xs mt-3 font-semibold">
//                 For pickup
//               </p>
//             </div>
//           </div>

//           {/* Auto-refresh indicator */}
//           <div className="mt-4 text-center">
//             <p className="text-xs text-slate-500 font-semibold">
//               🔄 Auto-refreshing every 5 seconds • Showing only active orders
//               (Pending → Preparing → Ready → Served)
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Orders Grid */}
//       <div className="max-w-7xl mx-auto px-6 py-12">
//         {orders.length === 0 ? (
//           <div className="flex items-center justify-center min-h-96 rounded-2xl bg-gradient-to-br from-green-600/10 to-green-700/5 border-2 border-green-500/20 backdrop-blur-sm">
//             <div className="text-center">
//               <div className="text-8xl mb-6 animate-bounce">✨</div>
//               <p className="text-3xl font-black text-green-400 mb-2">
//                 No Active Orders
//               </p>
//               <p className="text-green-300 text-lg font-semibold">
//                 Kitchen is all caught up. Waiting for new orders...
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
//             {sortedOrders.map((order) => {
//               const statusConfig = {
//                 pending: {
//                   bgGradient: "from-red-600/20 to-red-700/10",
//                   border: "border-red-500/30",
//                   badge: "bg-red-500/20 text-red-300 border border-red-500/30",
//                   buttonGradient:
//                     "from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
//                   icon: "⏱️",
//                   buttonText: "🍳 Start Cooking",
//                   nextStatus: "preparing" as const,
//                   accentColor: "text-red-400",
//                   statusLabel: "NEW ORDER",
//                 },
//                 preparing: {
//                   bgGradient: "from-amber-600/20 to-amber-700/10",
//                   border: "border-amber-500/30",
//                   badge:
//                     "bg-amber-500/20 text-amber-300 border border-amber-500/30",
//                   buttonGradient:
//                     "from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800",
//                   icon: "🍳",
//                   buttonText: "✓ Mark as Ready",
//                   nextStatus: "ready" as const,
//                   accentColor: "text-amber-400",
//                   statusLabel: "COOKING",
//                 },
//                 ready: {
//                   bgGradient: "from-green-600/20 to-green-700/10",
//                   border: "border-green-500/30",
//                   badge:
//                     "bg-green-500/20 text-green-300 border border-green-500/30",
//                   buttonGradient:
//                     "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
//                   icon: "✓",
//                   buttonText: "🎉 Mark as Served",
//                   nextStatus: "served" as const,
//                   accentColor: "text-green-400",
//                   statusLabel: "READY FOR PICKUP",
//                 },
//               };

//               const config =
//                 statusConfig[order.status as keyof typeof statusConfig];
//               const timeElapsed = getTimeElapsed(order.createdAt);
//               const orderTime = formatTime(order.createdAt);

//               return (
//                 <div
//                   key={order._id}
//                   className={`bg-gradient-to-br ${config.bgGradient} ${config.border} border rounded-2xl p-8 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
//                 >
//                   {/* Order Header */}
//                   <div className="mb-6 pb-6 border-b border-slate-600/30">
//                     <div className="flex items-center justify-between mb-3">
//                       <h2
//                         className={`text-5xl font-black ${config.accentColor}`}
//                       >
//                         TABLE {order.tableNumber}
//                       </h2>
//                       <span className="text-4xl">{config.icon}</span>
//                     </div>
//                     <div className="space-y-2">
//                       <div className="flex items-center gap-3 flex-wrap">
//                         <span
//                           className={`text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wide ${config.badge}`}
//                         >
//                           {config.statusLabel}
//                         </span>
//                         <span className="text-xs text-slate-400 font-semibold bg-slate-800/50 px-3 py-1.5 rounded-lg">
//                           {timeElapsed}
//                         </span>
//                       </div>
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-slate-400 font-semibold">
//                           Customer:{" "}
//                           <span className="text-white">{order.customerId}</span>
//                         </span>
//                         <span className="text-slate-400 font-semibold">
//                           {orderTime}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Order Items */}
//                   <div className="mb-6 space-y-3">
//                     <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
//                       Order Items ({order.items.length})
//                     </p>
//                     {order.items.map((item, idx) => (
//                       <div
//                         key={idx}
//                         className="bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm border border-slate-700/30"
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1">
//                             <p className="font-black text-lg text-white mb-1">
//                               {item.name}
//                             </p>
//                             <p className="text-sm text-slate-400 font-semibold">
//                               NPR. {item.price.toFixed(2)} each
//                             </p>
//                           </div>
//                           <div className="text-right">
//                             <div
//                               className={`text-3xl font-black ${config.accentColor}`}
//                             >
//                               ×{item.qty}
//                             </div>
//                             <p className="text-sm text-slate-400 font-semibold">
//                               NPR. {(item.price * item.qty).toFixed(2)}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Order Total */}
//                   <div className="mb-6 pb-4 border-b border-slate-600/30">
//                     <div className="flex justify-between items-center">
//                       <span className="text-sm font-black text-slate-400 uppercase">
//                         Total Amount
//                       </span>
//                       <span
//                         className={`text-2xl font-black ${config.accentColor}`}
//                       >
//                         NPR. {order.totalAmount.toFixed(2)}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="space-y-3">
//                     <button
//                       onClick={() => {
//                         console.log(
//                           `Updating order ${order._id} from ${order.status} to ${config.nextStatus}`
//                         );
//                         updateOrderStatus(order._id, config.nextStatus);
//                       }}
//                       className={`w-full bg-gradient-to-r ${config.buttonGradient} text-white font-black py-4 rounded-xl transition-all text-lg shadow-lg hover:shadow-xl`}
//                     >
//                       {config.buttonText}
//                     </button>

//                     {/* Cancel/Remove button for pending orders */}
//                     {order.status === "pending" && (
//                       <button
//                         onClick={() => {
//                           if (
//                             confirm(
//                               `Cancel order for Table ${order.tableNumber}?`
//                             )
//                           ) {
//                             completeOrder(order._id);
//                           }
//                         }}
//                         className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all"
//                       >
//                         ✕ Cancel Order
//                       </button>
//                     )}
//                   </div>

//                   {/* Debug Info (remove in production) */}
//                   <div className="mt-4 pt-4 border-t border-slate-700/30">
//                     <p className="text-xs text-slate-500 font-mono">
//                       ID: {order._id.slice(-6)} | Status: {order.status}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import ioClient, { Socket } from "socket.io-client";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  _id: string;
  tableNumber: number;
  customerId: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "served";
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  name: string;
  email: string;
  role: string;
}

// let socket: Socket;

let socket: ReturnType<typeof ioClient>;

export default function KitchenDashboard({ onBack }: { onBack?: () => void }) {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Auth check + fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");

        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Kitchen staff can be "kitchen" or "admin" — allow both
        if (!["admin", "kitchen"].includes(res.data.role)) {
          throw new Error("Not authorized for kitchen");
        }

        setCurrentUser(res.data);
      } catch (error) {
        toast.error("Access denied. Redirecting to login...");
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/orders");
      const activeOrders = response.data.filter(
        (order: Order) => order.status !== "served"
      );
      setOrders(activeOrders);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    socket = ioClient("http://localhost:5000");

    socket.on("new-order", (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success(`New order from table ${order.tableNumber}!`);
    });

    socket.on("order-status-updated", (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      toast.success(
        `Order for table ${updatedOrder.tableNumber} marked ${updatedOrder.status}`
      );
    });

    socket.on("table-freed", (tableNumber: number) => {
      setOrders((prev) => prev.filter((o) => o.tableNumber !== tableNumber));
      toast.success(`Table ${tableNumber} is now available`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "preparing" | "ready" | "served"
  ) => {
    const originalOrders = [...orders];
    try {
      if (newStatus === "served") {
        setOrders(orders.filter((o) => o._id !== orderId));
      } else {
        setOrders(
          orders.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o
          )
        );
      }

      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus,
      });

      toast.success(`Order marked as ${newStatus}!`);
      fetchOrders();
    } catch (err) {
      setOrders(originalOrders);
      toast.error("Failed to update status");
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string) => {
    if (!confirm("Cancel this order?")) return;
    const original = [...orders];
    try {
      setOrders(orders.filter((o) => o._id !== orderId));
      await axios.delete(`http://localhost:5000/api/orders/${orderId}`);
      toast.success("Order cancelled");
      fetchOrders();
    } catch (err) {
      setOrders(original);
      toast.error("Failed to cancel");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  // Stats
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;

  const sortedOrders = [...orders].sort((a, b) => {
    const priority = { pending: 0, preparing: 1, ready: 2 };
    if (priority[a.status] !== priority[b.status])
      return priority[a.status] - priority[b.status];
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTimeElapsed = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    return diff < 1 ? "Just now" : `${diff} min${diff > 1 ? "s" : ""} ago`;
  };

  const avatarLetter = currentUser?.name.charAt(0).toUpperCase() || "K";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">👨‍🍳</div>
          <p className="text-3xl font-black text-white">Loading Kitchen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-lg bg-slate-900/90 border-b-2 border-amber-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                👨‍🍳
              </div>
              <div>
                <p className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  Live Kitchen
                </p>
                <h1 className="text-2xl font-black text-white">Dashboard</h1>
              </div>
            </div>

            {/* Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xl rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
              >
                {avatarLetter}
              </button>

              {showDropdown && (
                <>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-200 text-center">
                      <p className="font-black text-slate-900 text-lg">
                        {currentUser?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {currentUser?.email}
                      </p>
                      <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-wide">
                        Kitchen Staff
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-bold text-sm transition"
                    >
                      🚪 Logout
                    </button>
                  </div>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowDropdown(false)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div className="bg-gradient-to-br from-red-600/30 to-red-800/10 border border-red-500/40 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-red-300 uppercase mb-1">
                    Pending
                  </p>
                  <p className="text-3xl font-black text-red-400">
                    {pendingCount}
                  </p>
                </div>
                <div className="text-3xl">⏱️</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-600/30 to-amber-800/10 border border-amber-500/40 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-amber-300 uppercase mb-1">
                    Cooking
                  </p>
                  <p className="text-3xl font-black text-amber-400">
                    {preparingCount}
                  </p>
                </div>
                <div className="text-3xl">🍳</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/30 to-green-800/10 border border-green-500/40 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-green-300 uppercase mb-1">
                    Ready
                  </p>
                  <p className="text-3xl font-black text-green-400">
                    {readyCount}
                  </p>
                </div>
                <div className="text-3xl">🔔</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-7xl mb-6 animate-bounce">✨</div>
            <p className="text-3xl font-black text-green-400 mb-2">
              All Caught Up!
            </p>
            <p className="text-lg text-slate-300">
              No pending orders. Great job, team! 👏
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedOrders.map((order) => {
              const config = {
                pending: {
                  gradient: "from-red-600/20 to-red-800/10",
                  border: "border-red-500/40",
                  badge: "bg-red-500/20 text-red-300 border-red-500/40",
                  button: "from-red-600 to-red-700",
                  text: "text-red-400",
                  icon: "⏱️",
                  label: "NEW",
                  next: "preparing" as const,
                },
                preparing: {
                  gradient: "from-amber-600/20 to-amber-800/10",
                  border: "border-amber-500/40",
                  badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                  button: "from-amber-600 to-amber-700",
                  text: "text-amber-400",
                  icon: "🍳",
                  label: "COOKING",
                  next: "ready" as const,
                },
                ready: {
                  gradient: "from-green-600/20 to-green-800/10",
                  border: "border-green-500/40",
                  badge: "bg-green-500/20 text-green-300 border-green-500/40",
                  button: "from-green-600 to-green-700",
                  text: "text-green-400",
                  icon: "🔔",
                  label: "READY",
                  next: "served" as const,
                },
              }[order.status];

              return (
                <div
                  key={order._id}
                  className={`bg-gradient-to-br ${config.gradient} ${config.border} border-2 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all`}
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-center mb-2">
                    <h2 className={`text-2xl font-black ${config.text}`}>
                      TABLE {order.tableNumber}
                    </h2>
                    <span className="text-2xl">{config.icon}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-black ${config.badge}`}
                    >
                      {config.label}
                    </span>
                    <span className="px-2 py-1 bg-slate-800/40 rounded-full text-xs text-slate-300 font-bold">
                      {getTimeElapsed(order.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 font-bold mb-2">
                    Customer:{" "}
                    <span className="text-white">{order.customerId}</span>
                  </p>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-xl p-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm text-white">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              NPR {item.price.toFixed(2)} each
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-black ${config.text}`}>
                              ×{item.qty}
                            </p>
                            <p className="text-xs text-slate-300 font-bold">
                              NPR {(item.price * item.qty).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-slate-600/40 pt-2 mb-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black text-slate-300">Total</p>
                      <p className={`text-xl font-black ${config.text}`}>
                        NPR {order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <button
                    onClick={() => updateOrderStatus(order._id, config.next)}
                    className={`w-full bg-gradient-to-r ${config.button} text-white font-bold text-sm py-2 rounded-xl shadow-sm hover:shadow-md transition`}
                  >
                    {config.next === "preparing" && "🍳 Start"}
                    {config.next === "ready" && "✓ Ready"}
                    {config.next === "served" && "🎉 Served"}
                  </button>

                  {order.status === "pending" && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm py-1 rounded-xl transition"
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
