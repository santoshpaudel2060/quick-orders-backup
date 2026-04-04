"use client";

import React, { useEffect, useState } from "react";
import { useOrderTracking } from "../../hooks/useOrderTracking";
import OrderTrackingCard from "../../components/OrderTrackingCard";
import axios from "axios";

interface Order {
  _id: string;
  tableNumber: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  status: string;
  totalAmount: number;
  createdAt: Date;
  progress?: number;
  completedAt?: Date;
}

export default function OrderTrackingPage() {
  const { isConnected, subscribeToOrder } = useOrderTracking();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Get table number and session ID from query params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const table = urlParams.get("table");
    const session = urlParams.get("session");

    if (table) {
      setTableNumber(parseInt(table));
    } else {
      const savedTable = localStorage.getItem("tableNumber");
      if (savedTable) setTableNumber(parseInt(savedTable));
    }

    if (session) {
      setSessionId(session);
    } else {
      const savedSession = localStorage.getItem("guestSessionId");
      if (savedSession) setSessionId(savedSession);
    }
  }, []);

  // Fetch orders for the table or session
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/orders`;

        if (tableNumber) {
          url += `/table/${tableNumber}`;
        } else if (sessionId) {
          url += `?sessionId=${sessionId}`;
        } else {
          console.log("No table number or session ID found");
          setLoading(false);
          return;
        }

        console.log("Fetching orders from:", url);
        const response = await axios.get(url);
        const fetchedOrders = response.data || [];
        console.log("Fetched orders:", fetchedOrders);
        setOrders(fetchedOrders);

        // Subscribe to tracking updates for each order
        fetchedOrders.forEach((order: Order) => {
          console.log("Subscribing to order:", order._id);
          subscribeToOrder(order._id);
        });
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tableNumber || sessionId) {
      fetchOrders();
      // REMOVED: Polling has been disabled
      // Socket.io is now the sole source of truth for real-time updates
      // Orders are fetched only once on page load
    }
  }, [tableNumber, sessionId, subscribeToOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white mb-2">
            Order Tracking
          </h1>
          <p className="text-slate-300 text-lg">
            Real-time updates of your orders
          </p>

          {/* Connection Status */}
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-semibold text-slate-300">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-slate-300 mt-4 font-semibold">
                Loading your orders...
              </p>
            </div>
          </div>
        )}

        {/* No Orders State */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">📦</p>
            <h2 className="text-2xl font-black text-white mb-2">
              No Orders Found
            </h2>
            <p className="text-slate-300 mb-6">
              {tableNumber
                ? `No orders for Table ${tableNumber}`
                : "You haven't placed any orders yet"}
            </p>
            <a
              href="/customer"
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg"
            >
              Start Ordering
            </a>
          </div>
        )}

        {/* Orders Grid */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((order) => (
              <OrderTrackingCard
                key={order._id}
                order={order}
                showDetails={true}
                compact={false}
              />
            ))}
          </div>
        )}

        {/* Table/Session Info */}
        {!loading && orders.length > 0 && (
          <div className="mt-8 p-4 bg-slate-700 rounded-xl text-slate-300 text-sm">
            {tableNumber && (
              <p>
                <span className="font-bold">Table:</span> {tableNumber}
              </p>
            )}
            {sessionId && (
              <p>
                <span className="font-bold">Session ID:</span>{" "}
                <span className="font-mono text-xs">{sessionId}</span>
              </p>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <a
            href="/customer"
            className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
          >
            ← Back to Menu
          </a>
        </div>
      </div>
    </div>
  );
}
