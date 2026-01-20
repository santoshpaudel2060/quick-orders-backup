// "use client";

// import { useEffect, useState } from "react";
// import { api } from "../../libs/api";

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
//   status: "pending" | "cooking" | "ready" | "served" | "paid";
//   totalAmount: number;
//   createdAt: string;
// }

// const statusColors: Record<Order["status"], string> = {
//   pending: "bg-red-100 text-red-800 border border-red-300",
//   cooking: "bg-yellow-100 text-yellow-800 border border-yellow-300",
//   ready: "bg-blue-100 text-blue-800 border border-blue-300",
//   served: "bg-green-100 text-green-800 border border-green-300",
//   paid: "bg-gray-100 text-gray-800 border border-gray-300",
// };

// const statusEmoji: Record<Order["status"], string> = {
//   pending: "⏱️",
//   cooking: "🍳",
//   ready: "✓",
//   served: "🍽️",
//   paid: "💳",
// };

// export default function OrdersPage() {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         const res = await api.get("/orders/all");
//         setOrders(res.data || []);
//       } catch (error) {
//         console.error("Failed to fetch orders:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//     const interval = setInterval(fetchOrders, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const updateStatus = async (orderId: string, newStatus: Order["status"]) => {
//     try {
//       await api.post("/orders/update-status", { orderId, status: newStatus });
//       setOrders((prev) =>
//         prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
//       );
//     } catch (error) {
//       console.error("Failed to update order status:", error);
//     }
//   };

//   const pending = orders.filter((o) => o.status === "pending");
//   const cooking = orders.filter((o) => o.status === "cooking");
//   const ready = orders.filter((o) => o.status === "ready");
//   const served = orders.filter((o) => o.status === "served");

//   if (loading) return <div className="p-8 text-center">Loading orders...</div>;

//   return (
//     <div className="min-h-screen bg-slate-50 p-8">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-4xl font-black text-slate-900 mb-8">
//           📋 Active Orders
//         </h1>

//         <div className="grid grid-cols-5 gap-4 mb-8">
//           <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
//             <p className="text-3xl font-black text-red-600">{pending.length}</p>
//             <p className="text-sm font-bold text-red-700">Pending</p>
//           </div>
//           <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
//             <p className="text-3xl font-black text-yellow-600">
//               {cooking.length}
//             </p>
//             <p className="text-sm font-bold text-yellow-700">Cooking</p>
//           </div>
//           <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
//             <p className="text-3xl font-black text-blue-600">{ready.length}</p>
//             <p className="text-sm font-bold text-blue-700">Ready</p>
//           </div>
//           <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
//             <p className="text-3xl font-black text-green-600">
//               {served.length}
//             </p>
//             <p className="text-sm font-bold text-green-700">Served</p>
//           </div>
//           {/* <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
//             <p className="text-3xl font-black text-gray-600">
//               {orders.filter((o) => o.status === "paid").length}
//             </p>
//             <p className="text-sm font-bold text-gray-700">Paid</p>
//           </div> */}
//         </div>

//         {orders.length === 0 ? (
//           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center">
//             <p className="text-2xl font-black text-slate-600 mb-2">
//               🎉 No Active Orders
//             </p>
//             <p className="text-slate-500 font-semibold">
//               All orders are completed
//             </p>
//           </div>
//         ) : (
//           <div className="grid gap-6">
//             {orders.map((order) => (
//               <div
//                 key={order._id}
//                 className={`border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all ${
//                   order.status === "pending"
//                     ? "border-red-300 bg-red-50"
//                     : order.status === "cooking"
//                     ? "border-yellow-300 bg-yellow-50"
//                     : order.status === "ready"
//                     ? "border-blue-300 bg-blue-50"
//                     : order.status === "served"
//                     ? "border-green-300 bg-green-50"
//                     : "border-gray-300 bg-gray-50"
//                 }`}
//               >
//                 {/* Header */}
//                 <div
//                   className={`px-6 py-4 text-white ${
//                     order.status === "pending"
//                       ? "bg-red-500"
//                       : order.status === "cooking"
//                       ? "bg-yellow-500"
//                       : order.status === "ready"
//                       ? "bg-blue-500"
//                       : order.status === "served"
//                       ? "bg-green-500"
//                       : "bg-gray-500"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <p className="text-sm font-bold opacity-80">
//                         Table {order.tableNumber}
//                       </p>
//                       <p className="text-2xl font-black">
//                         {statusEmoji[order.status]} {order.status.toUpperCase()}
//                       </p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm opacity-80">
//                         Customer: {order.customerId}
//                       </p>
//                       <p className="text-sm opacity-80">
//                         {new Date(order.createdAt).toLocaleTimeString()}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="px-6 py-4">
//                   <h3 className="font-black text-gray-900 mb-3">
//                     Order Items:
//                   </h3>
//                   <div className="space-y-2 mb-4">
//                     {order.items.map((item, idx) => (
//                       <div key={idx} className="flex justify-between text-sm">
//                         <span className="text-gray-700">
//                           {item.qty}x {item.name}
//                         </span>
//                         <span className="font-bold text-gray-900">
//                           ${(item.qty * item.price).toFixed(2)}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                   <div className="border-t-2 border-gray-300 pt-3 mb-4">
//                     <div className="flex justify-between font-black text-lg">
//                       <span>Total:</span>
//                       <span>${order.totalAmount.toFixed(2)}</span>
//                     </div>
//                   </div>

//                   {/* Status Update Buttons */}
//                   <div className="flex gap-2">
//                     {order.status === "pending" && (
//                       <button
//                         onClick={() => updateStatus(order._id, "cooking")}
//                         className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-bold text-sm"
//                       >
//                         Send to Kitchen
//                       </button>
//                     )}
//                     {order.status === "cooking" && (
//                       <button
//                         onClick={() => updateStatus(order._id, "ready")}
//                         className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded font-bold text-sm"
//                       >
//                         Mark Ready
//                       </button>
//                     )}
//                     {order.status === "ready" && (
//                       <button
//                         onClick={() => updateStatus(order._id, "served")}
//                         className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-bold text-sm"
//                       >
//                         Served
//                       </button>
//                     )}
//                     {order.status === "served" && (
//                       <button
//                         onClick={() => updateStatus(order._id, "paid")}
//                         className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-bold text-sm"
//                       >
//                         Mark Paid
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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

const API_BASE_URL = "http://localhost:5000/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/orders`);

      // Sort by most recent first
      const sortedOrders = response.data.sort(
        (a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(sortedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-refresh every 3 seconds for real-time updates
    const interval = setInterval(fetchOrders, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "preparing" | "ready" | "served"
  ) => {
    try {
      await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: newStatus,
      });

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;

    const matchesSearch =
      searchTerm === "" ||
      order.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber.toString().includes(searchTerm) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    served: orders.filter((o) => o.status === "served").length,
    totalRevenue: orders
      .filter((o) => o.status === "served")
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-700 border-red-300";
      case "preparing":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "ready":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "served":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-500";
      case "preparing":
        return "bg-amber-500";
      case "ready":
        return "bg-blue-500";
      case "served":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-slate-700">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-4">
          📋 Orders Management
        </h1>
        <p className="text-white opacity-90 font-semibold">
          Real-time order tracking and management (Auto-refreshing every 3
          seconds)
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200">
          <p className="text-sm font-black text-slate-600 uppercase mb-2">
            Total Orders
          </p>
          <p className="text-4xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-200">
          <p className="text-sm font-black text-red-600 uppercase mb-2">
            Pending
          </p>
          <p className="text-4xl font-black text-red-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-200">
          <p className="text-sm font-black text-amber-600 uppercase mb-2">
            Preparing
          </p>
          <p className="text-4xl font-black text-amber-600">
            {stats.preparing}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
          <p className="text-sm font-black text-blue-600 uppercase mb-2">
            Ready
          </p>
          <p className="text-4xl font-black text-blue-600">{stats.ready}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
          <p className="text-sm font-black text-green-600 uppercase mb-2">
            Served
          </p>
          <p className="text-4xl font-black text-green-600">{stats.served}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg">
          <p className="text-sm font-black text-white uppercase mb-2">
            Total Revenue
          </p>
          <p className="text-2xl font-black text-white">
            NPR {stats.totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              🔍 Search Orders
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, table number, or order ID..."
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">
              📊 Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-semibold bg-white"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center shadow-lg">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-2xl font-black text-slate-600 mb-2">
            No orders found
          </p>
          <p className="text-slate-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Orders will appear here once customers start placing them"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden hover:shadow-2xl transition-all"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-6 border-b-2 border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Order ID Badge */}
                    <div className="bg-amber-500 text-white px-4 py-2 rounded-xl font-black text-sm">
                      #{order._id.slice(-6)}
                    </div>

                    {/* Table Number */}
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">🪑</span>
                      <div>
                        <p className="text-xs text-slate-500 font-bold">
                          Table
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                          {order.tableNumber}
                        </p>
                      </div>
                    </div>

                    {/* Customer Name */}
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">👤</span>
                      <div>
                        <p className="text-xs text-slate-500 font-bold">
                          Customer
                        </p>
                        <p className="text-xl font-black text-slate-900">
                          {order.customerId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-5 py-2 rounded-full text-sm font-black uppercase border-2 ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-6">
                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    🍽️ Order Items ({order.items.length})
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-amber-100 text-amber-800 font-black text-sm px-3 py-1 rounded-full">
                            {item.qty}x
                          </span>
                          <span className="font-bold text-slate-900 text-lg">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 font-semibold">
                            NPR {item.price.toFixed(2)} each
                          </p>
                          <p className="text-lg font-black text-amber-600">
                            NPR {(item.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-black text-slate-900">
                      Total Amount
                    </p>
                    <p className="text-4xl font-black text-green-600">
                      NPR {order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">
                      Order Placed
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(order.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">
                      Last Updated
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(order.updatedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {order.status === "pending" && (
                    <button
                      onClick={() => updateOrderStatus(order._id, "preparing")}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg"
                    >
                      ▶️ Start Preparing
                    </button>
                  )}

                  {order.status === "preparing" && (
                    <button
                      onClick={() => updateOrderStatus(order._id, "ready")}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg"
                    >
                      ✅ Mark as Ready
                    </button>
                  )}

                  {order.status === "ready" && (
                    <button
                      onClick={() => updateOrderStatus(order._id, "served")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg"
                    >
                      🍽️ Mark as Served
                    </button>
                  )}

                  {order.status === "served" && (
                    <div className="flex-1 bg-green-100 border-2 border-green-300 text-green-700 font-black py-3 px-6 rounded-xl text-center">
                      ✅ Order Completed
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteOrder(order._id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
