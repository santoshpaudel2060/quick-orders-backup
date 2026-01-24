// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import axios from "axios";
// import toast from "react-hot-toast";

// import ioClient, { Socket } from "socket.io-client";

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

// interface CurrentUser {
//   name: string;
//   email: string;
//   role: string;
// }

// // let socket: Socket;

// let socket: ReturnType<typeof ioClient>;

// export default function KitchenDashboard({ onBack }: { onBack?: () => void }) {
//   const router = useRouter();

//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
//   const [showDropdown, setShowDropdown] = useState(false);

//   // Auth check + fetch user data
//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) throw new Error("No token");

//         const res = await axios.get("http://localhost:5000/api/auth/me", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         // Kitchen staff can be "kitchen" or "admin" — allow both
//         if (!["admin", "kitchen"].includes(res.data.role)) {
//           throw new Error("Not authorized for kitchen");
//         }

//         setCurrentUser(res.data);
//       } catch (error) {
//         toast.error("Access denied. Redirecting to login...");
//         router.push("/login");
//       }
//     };
//     checkAuth();
//   }, [router]);

//   // Fetch orders
//   const fetchOrders = async () => {
//     try {
//       const response = await axios.get("http://localhost:5000/api/orders");
//       const activeOrders = response.data.filter(
//         (order: Order) => order.status !== "served",
//       );
//       setOrders(activeOrders);
//       setError(null);
//     } catch (err: any) {
//       console.error("Failed to fetch orders:", err);
//       setError("Failed to load orders. Retrying...");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();

//     socket = ioClient("http://localhost:5000");

//     socket.on("new-order", (order: Order) => {
//       setOrders((prev) => [order, ...prev]);
//       toast.success(`New order from table ${order.tableNumber}!`);
//     });

//     socket.on("order-status-updated", (updatedOrder: Order) => {
//       setOrders((prev) =>
//         prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
//       );
//       toast.success(
//         `Order for table ${updatedOrder.tableNumber} marked ${updatedOrder.status}`,
//       );
//     });

//     socket.on("table-freed", (tableNumber: number) => {
//       setOrders((prev) => prev.filter((o) => o.tableNumber !== tableNumber));
//       toast.success(`Table ${tableNumber} is now available`);
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   const updateOrderStatus = async (
//     orderId: string,
//     newStatus: "preparing" | "ready" | "served",
//   ) => {
//     const originalOrders = [...orders];
//     try {
//       if (newStatus === "served") {
//         setOrders(orders.filter((o) => o._id !== orderId));
//       } else {
//         setOrders(
//           orders.map((o) =>
//             o._id === orderId ? { ...o, status: newStatus } : o,
//           ),
//         );
//       }

//       await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
//         status: newStatus,
//       });

//       toast.success(`Order marked as ${newStatus}!`);
//       fetchOrders();
//     } catch (err) {
//       setOrders(originalOrders);
//       toast.error("Failed to update status");
//     }
//   };

//   // Cancel order
//   const cancelOrder = async (orderId: string) => {
//     if (!confirm("Cancel this order?")) return;
//     const original = [...orders];
//     try {
//       setOrders(orders.filter((o) => o._id !== orderId));
//       await axios.delete(`http://localhost:5000/api/orders/${orderId}`);
//       toast.success("Order cancelled");
//       fetchOrders();
//     } catch (err) {
//       setOrders(original);
//       toast.error("Failed to cancel");
//     }
//   };

//   // Logout
//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     toast.success("Logged out successfully");
//     router.push("/login");
//   };

//   // Stats
//   const pendingCount = orders.filter((o) => o.status === "pending").length;
//   const preparingCount = orders.filter((o) => o.status === "preparing").length;
//   const readyCount = orders.filter((o) => o.status === "ready").length;

//   const sortedOrders = [...orders].sort((a, b) => {
//     const priority = { pending: 0, preparing: 1, ready: 2 };
//     if (priority[a.status] !== priority[b.status])
//       return priority[a.status] - priority[b.status];
//     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
//   });

//   const formatTime = (date: string) =>
//     new Date(date).toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//   const getTimeElapsed = (date: string) => {
//     const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
//     return diff < 1 ? "Just now" : `${diff} min${diff > 1 ? "s" : ""} ago`;
//   };

//   const avatarLetter = currentUser?.name.charAt(0).toUpperCase() || "K";

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-8xl mb-6 animate-bounce">👨‍🍳</div>
//           <p className="text-3xl font-black text-white">Loading Kitchen...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//       {/* Header */}
//       {/* Header */}
//       <div className="sticky top-0 z-20 backdrop-blur-lg bg-slate-900/90 border-b-2 border-amber-500 shadow-md">
//         <div className="max-w-7xl mx-auto px-4 py-4">
//           <div className="flex justify-between items-center mb-4">
//             <div className="flex items-center gap-4">
//               <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
//                 👨‍🍳
//               </div>
//               <div>
//                 <p className="text-xs font-black text-amber-400 uppercase tracking-widest">
//                   Live Kitchen
//                 </p>
//                 <h1 className="text-2xl font-black text-white">Dashboard</h1>
//               </div>
//             </div>

//             {/* Avatar Dropdown */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowDropdown(!showDropdown)}
//                 className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xl rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
//               >
//                 {avatarLetter}
//               </button>

//               {showDropdown && (
//                 <>
//                   <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
//                     <div className="px-4 py-3 border-b border-slate-200 text-center">
//                       <p className="font-black text-slate-900 text-lg">
//                         {currentUser?.name}
//                       </p>
//                       <p className="text-xs text-slate-500">
//                         {currentUser?.email}
//                       </p>
//                       <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-wide">
//                         Kitchen Staff
//                       </p>
//                     </div>
//                     <button
//                       onClick={handleLogout}
//                       className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-bold text-sm transition"
//                     >
//                       🚪 Logout
//                     </button>
//                   </div>
//                   <div
//                     className="fixed inset-0 z-30"
//                     onClick={() => setShowDropdown(false)}
//                   />
//                 </>
//               )}
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
//             <div className="bg-gradient-to-br from-red-600/30 to-red-800/10 border border-red-500/40 rounded-2xl p-4 backdrop-blur-sm">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="text-xs font-black text-red-300 uppercase mb-1">
//                     Pending
//                   </p>
//                   <p className="text-3xl font-black text-red-400">
//                     {pendingCount}
//                   </p>
//                 </div>
//                 <div className="text-3xl">⏱️</div>
//               </div>
//             </div>

//             <div className="bg-gradient-to-br from-amber-600/30 to-amber-800/10 border border-amber-500/40 rounded-2xl p-4 backdrop-blur-sm">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="text-xs font-black text-amber-300 uppercase mb-1">
//                     Cooking
//                   </p>
//                   <p className="text-3xl font-black text-amber-400">
//                     {preparingCount}
//                   </p>
//                 </div>
//                 <div className="text-3xl">🍳</div>
//               </div>
//             </div>

//             <div className="bg-gradient-to-br from-green-600/30 to-green-800/10 border border-green-500/40 rounded-2xl p-4 backdrop-blur-sm">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="text-xs font-black text-green-300 uppercase mb-1">
//                     Ready
//                   </p>
//                   <p className="text-3xl font-black text-green-400">
//                     {readyCount}
//                   </p>
//                 </div>
//                 <div className="text-3xl">🔔</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Orders */}
//       <div className="max-w-7xl mx-auto px-4 py-6">
//         {orders.length === 0 ? (
//           <div className="text-center py-16">
//             <div className="text-7xl mb-6 animate-bounce">✨</div>
//             <p className="text-3xl font-black text-green-400 mb-2">
//               All Caught Up!
//             </p>
//             <p className="text-lg text-slate-300">
//               No pending orders. Great job, team! 👏
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {sortedOrders.map((order) => {
//               const config = {
//                 pending: {
//                   gradient: "from-red-600/20 to-red-800/10",
//                   border: "border-red-500/40",
//                   badge: "bg-red-500/20 text-red-300 border-red-500/40",
//                   button: "from-red-600 to-red-700",
//                   text: "text-red-400",
//                   icon: "⏱️",
//                   label: "NEW",
//                   next: "preparing" as const,
//                 },
//                 preparing: {
//                   gradient: "from-amber-600/20 to-amber-800/10",
//                   border: "border-amber-500/40",
//                   badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
//                   button: "from-amber-600 to-amber-700",
//                   text: "text-amber-400",
//                   icon: "🍳",
//                   label: "COOKING",
//                   next: "ready" as const,
//                 },
//                 ready: {
//                   gradient: "from-green-600/20 to-green-800/10",
//                   border: "border-green-500/40",
//                   badge: "bg-green-500/20 text-green-300 border-green-500/40",
//                   button: "from-green-600 to-green-700",
//                   text: "text-green-400",
//                   icon: "🔔",
//                   label: "READY",
//                   next: "served" as const,
//                 },
//               }[order.status];

//               return (
//                 <div
//                   key={order._id}
//                   className={`bg-gradient-to-br ${config.gradient} ${config.border} border-2 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all`}
//                 >
//                   {/* Order Header */}
//                   <div className="flex justify-between items-center mb-2">
//                     <h2 className={`text-2xl font-black ${config.text}`}>
//                       TABLE {order.tableNumber}
//                     </h2>
//                     <span className="text-2xl">{config.icon}</span>
//                   </div>

//                   {/* Badges */}
//                   <div className="flex flex-wrap gap-2 mb-2">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-black ${config.badge}`}
//                     >
//                       {config.label}
//                     </span>
//                     <span className="px-2 py-1 bg-slate-800/40 rounded-full text-xs text-slate-300 font-bold">
//                       {getTimeElapsed(order.createdAt)}
//                     </span>
//                   </div>

//                   <p className="text-sm text-slate-300 font-bold mb-2">
//                     Customer:{" "}
//                     <span className="text-white">{order.customerId}</span>
//                   </p>

//                   {/* Items */}
//                   <div className="space-y-2 mb-4">
//                     {order.items.map((item, i) => (
//                       <div key={i} className="bg-slate-800/50 rounded-xl p-2">
//                         <div className="flex justify-between items-center">
//                           <div>
//                             <p className="font-bold text-sm text-white">
//                               {item.name}
//                             </p>
//                             <p className="text-xs text-slate-400">
//                               NPR {item.price.toFixed(2)} each
//                             </p>
//                           </div>
//                           <div className="text-right">
//                             <p className={`text-xl font-black ${config.text}`}>
//                               ×{item.qty}
//                             </p>
//                             <p className="text-xs text-slate-300 font-bold">
//                               NPR {(item.price * item.qty).toFixed(2)}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Total */}
//                   <div className="border-t border-slate-600/40 pt-2 mb-2">
//                     <div className="flex justify-between items-center">
//                       <p className="text-sm font-black text-slate-300">Total</p>
//                       <p className={`text-xl font-black ${config.text}`}>
//                         NPR {order.totalAmount.toFixed(2)}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Buttons */}
//                   <button
//                     onClick={() => updateOrderStatus(order._id, config.next)}
//                     className={`w-full bg-gradient-to-r ${config.button} text-white font-bold text-sm py-2 rounded-xl shadow-sm hover:shadow-md transition`}
//                   >
//                     {config.next === "preparing" && "🍳 Start"}
//                     {config.next === "ready" && "✓ Ready"}
//                     {config.next === "served" && "🎉 Served"}
//                   </button>

//                   {order.status === "pending" && (
//                     <button
//                       onClick={() => cancelOrder(order._id)}
//                       className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm py-1 rounded-xl transition"
//                     >
//                       ✕ Cancel
//                     </button>
//                   )}
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

const apiURL = process.env.NEXT_PUBLIC_API_URL;

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

        const res = await axios.get(`${apiURL}/api/auth/me`, {
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
      const response = await axios.get(`${apiURL}/api/orders`);
      const activeOrders = response.data.filter(
        (order: Order) => order.status !== "served",
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

    socket = ioClient(apiURL);

    socket.on("new-order", (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success(`New order from table ${order.tableNumber}!`);
    });

    socket.on("order-status-updated", (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
      );
      toast.success(
        `Order for table ${updatedOrder.tableNumber} marked ${updatedOrder.status}`,
      );
    });

    socket.on("table-freed", (tableNumber: number) => {
      setOrders((prev) => prev.filter((o) => o.tableNumber !== tableNumber));
      toast.success(`Table ${tableNumber} is now available`);
    });

    // remove deleted/cancelled orders in real-time
    socket.on("order:deleted", ({ orderId }: { orderId: string }) => {
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      toast.success(`Order ${orderId} cancelled`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "preparing" | "ready" | "served",
  ) => {
    const originalOrders = [...orders];
    try {
      if (newStatus === "served") {
        setOrders(orders.filter((o) => o._id !== orderId));
      } else {
        setOrders(
          orders.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o,
          ),
        );
      }

      await axios.put(`${apiURL}/api/orders/${orderId}/status`, {
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
      await axios.delete(`${apiURL}/api/orders/${orderId}`);
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
