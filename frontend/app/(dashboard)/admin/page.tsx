"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MenuItemPage from "./menuItem/page";
import TablePage from "./table/page";
import OrdersPage from "./orders/page";
import axios from "axios";
import toast from "react-hot-toast";

interface RealTable {
  _id: string;
  tableNumber: number;
  status: "available" | "occupied" | "reserved";
  qrCodeUrl?: string;
  currentCustomer?: string | null;
}

interface Payment {
  _id: string;
  transactionUuid: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  tableNumber: number;
  customerName?: string;
  createdAt: string;
}

interface CurrentUser {
  name: string;
  email: string;
  role: string;
}

const apiURL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  // All hooks at the top
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "menu" | "tables" | "orders" | "payments" | "settings"
  >("overview");

  const [realTables, setRealTables] = useState<RealTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

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

        if (res.data.role !== "admin") throw new Error("Not admin");

        setCurrentUser(res.data);
        setIsAuthorized(true);
      } catch (error) {
        toast.error("You are not authorized to view this page");
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Fetch real tables with auto-refresh
  useEffect(() => {
    const fetchRealTables = async () => {
      try {
        setLoadingTables(true);
        const res = await axios.get(`${apiURL}/api/tables`);
        setRealTables(res.data);
      } catch (error) {
        console.error("Failed to fetch tables:", error);
        toast.error("Could not load tables");
      } finally {
        setLoadingTables(false);
      }
    };

    if (isAuthorized) {
      fetchRealTables();

      // Auto-refresh tables every 5 seconds to show real-time status
      const interval = setInterval(fetchRealTables, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  // Fetch payments
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTab === "payments" && isAuthorized) {
      const fetchPayments = async () => {
        try {
          setLoadingPayments(true);
          const res = await axios.get(`${apiURL}/api/payments/admin/payments`);

          const paymentsArray = Array.isArray(res.data)
            ? res.data
            : res.data.payments || [];

          setPayments(paymentsArray);
        } catch (error) {
          console.error("Failed to fetch payments:", error);
          setPayments([]);
        } finally {
          setLoadingPayments(false);
        }
      };

      fetchPayments();
      interval = setInterval(fetchPayments, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, isAuthorized]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  // Loading
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-3xl font-black text-slate-700">
          Checking permissions...
        </p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  // Stats
  const stats = {
    totalTables: realTables.length,
    availableTables: realTables.filter((t) => t.status === "available").length,
    occupiedTables: realTables.filter((t) => t.status === "occupied").length,
    reservedTables: realTables.filter((t) => t.status === "reserved").length,
  };

  // Avatar letter
  const avatarLetter = currentUser?.name.charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b-4 border-amber-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="text-5xl">⚙️</div>
              <div>
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
                  Management System
                </p>
                <h1 className="text-4xl font-black text-slate-900">
                  Admin Panel
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Avatar with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xl rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
                >
                  {avatarLetter}
                </button>

                {showDropdown && (
                  <>
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                      <div className="px-4 py-4 border-b border-slate-200 text-center">
                        <p className="font-black text-slate-900 text-lg">
                          {currentUser?.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {currentUser?.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-4 hover:bg-red-50 text-red-600 font-bold transition text-lg"
                      >
                        🚪 Logout
                      </button>
                    </div>

                    {/* Overlay - lower z-index */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowDropdown(false)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 border-b-2 border-slate-200 overflow-x-auto pb-2">
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "menu", label: "🍽️ Menu Items" },
              { id: "tables", label: "🪑 Tables" },
              { id: "orders", label: "📋 Orders" },
              { id: "payments", label: "💰 Payments" },
              { id: "settings", label: "⚙️ Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-black transition-all border-b-4 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-600 bg-amber-50"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {loadingTables ? (
              <p className="text-center text-2xl py-20">
                Loading table statistics...
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-10 shadow-2xl text-white">
                    <p className="text-lg font-black uppercase tracking-wide mb-4">
                      Total Tables
                    </p>
                    <p className="text-6xl font-black">{stats.totalTables}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-10 shadow-2xl text-white">
                    <p className="text-lg font-black uppercase tracking-wide mb-4">
                      Available
                    </p>
                    <p className="text-6xl font-black">
                      {stats.availableTables}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl p-10 shadow-2xl text-white">
                    <p className="text-lg font-black uppercase tracking-wide mb-4">
                      Occupied
                    </p>
                    <p className="text-6xl font-black">
                      {stats.occupiedTables}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-10 shadow-2xl text-white">
                    <p className="text-lg font-black uppercase tracking-wide mb-4">
                      Reserved
                    </p>
                    <p className="text-6xl font-black">
                      {stats.reservedTables}
                    </p>
                  </div>
                </div>

                {/* Real-time table list */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                      🪑 Real-Time Table Status
                      <span className="text-sm font-normal opacity-90">
                        (Auto-refreshing)
                      </span>
                    </h2>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {realTables.map((table) => (
                        <div
                          key={table._id}
                          className={`p-6 rounded-2xl border-2 transition-all ${
                            table.status === "available"
                              ? "border-green-300 bg-green-50"
                              : table.status === "occupied"
                                ? "border-orange-300 bg-orange-50"
                                : "border-purple-300 bg-purple-50"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-2xl font-black">
                              Table {table.tableNumber}
                            </p>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                table.status === "available"
                                  ? "bg-green-500 text-white"
                                  : table.status === "occupied"
                                    ? "bg-orange-500 text-white"
                                    : "bg-purple-500 text-white"
                              }`}
                            >
                              {table.status}
                            </span>
                          </div>

                          {table.currentCustomer && (
                            <p className="text-sm text-slate-600">
                              <span className="font-bold">Customer:</span>{" "}
                              {table.currentCustomer}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "menu" && <MenuItemPage />}
        {activeTab === "tables" && <TablePage />}
        {activeTab === "orders" && <OrdersPage />}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8">
              <h2 className="text-3xl font-black text-white">
                💰 Payment History
              </h2>
            </div>
            <div className="p-8">
              {loadingPayments ? (
                <p className="text-center text-xl py-12 text-slate-500">
                  Loading payments...
                </p>
              ) : payments.length === 0 ? (
                <p className="text-center text-xl py-12 text-slate-500">
                  No payments found yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="px-6 py-4 font-black text-slate-700">
                          Transaction ID
                        </th>
                        <th className="px-6 py-4 font-black text-slate-700">
                          Customer Name
                        </th>
                        <th className="px-6 py-4 font-black text-slate-700">
                          Table
                        </th>
                        <th className="px-6 py-4 font-black text-slate-700 text-right">
                          Amount
                        </th>
                        <th className="px-6 py-4 font-black text-slate-700 text-center">
                          Status
                        </th>
                        <th className="px-6 py-4 font-black text-slate-700">
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr
                          key={p._id}
                          className="border-b hover:bg-slate-50 transition"
                        >
                          <td className="px-6 py-4 font-mono text-sm text-slate-600">
                            {p.transactionUuid.slice(-12)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {p.customerName || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-black">
                              {p.tableNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-amber-600">
                            NPR {p.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-4 py-2 rounded-full text-xs font-black uppercase ${
                                p.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : p.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(p.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* {activeTab === "settings" && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-6">
              ⚙️ Restaurant Settings
            </h2>
            <p className="text-xl text-slate-600">
              More settings coming soon...
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
}
