"use client";

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

const apiURL = process.env.NEXT_PUBLIC_API_URL;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiURL}/api/orders`);

      // Sort by most recent first
      const sortedOrders = response.data.sort(
        (a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    newStatus: "pending" | "preparing" | "ready" | "served",
  ) => {
    try {
      await axios.patch(`${apiURL}/api/orders/${orderId}/status`, {
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
      await axios.delete(`${apiURL}/api/orders/${orderId}`);
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
                        order.status,
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
