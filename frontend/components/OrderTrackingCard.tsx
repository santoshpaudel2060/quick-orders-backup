import React, { useEffect, useState } from "react";
import { useOrderTracking } from "../hooks/useOrderTracking";
import OrderProgressBar from "./OrderProgressBar";
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

interface OrderTrackingCardProps {
  order: Order;
  showDetails?: boolean;
  compact?: boolean;
}

export const OrderTrackingCard: React.FC<OrderTrackingCardProps> = ({
  order,
  showDetails = true,
  compact = false,
}) => {
  const {
    getOrderProgress,
    subscribeToOrder,
    unsubscribeFromOrder,
    orderProgress,
  } = useOrderTracking();
  const [progress, setProgress] = useState(order.progress || 0);
  const [status, setStatus] = useState(order.status);
  const [completedAt, setCompletedAt] = useState(order.completedAt);

  useEffect(() => {
    subscribeToOrder(order._id);

    return () => {
      unsubscribeFromOrder(order._id);
    };
  }, [order._id, subscribeToOrder, unsubscribeFromOrder]);

  // Update local state when order progress changes
  useEffect(() => {
    const trackingData = getOrderProgress(order._id);
    if (trackingData) {
      console.log(`💾 Updating progress for order ${order._id}:`, trackingData);
      setProgress(trackingData.progress);
      setStatus(trackingData.status);
      setCompletedAt(trackingData.completedAt);
    }
  }, [order._id, orderProgress]);

  // Poll for fresh order data every 3 seconds as a fallback
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        // Try to get the order details by fetching all orders for this table
        // This ensures we get the latest progress even if Socket.io misses events
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/table/${order.tableNumber}`,
        );
        const orders = Array.isArray(response.data)
          ? response.data
          : [response.data];
        const freshOrder = orders.find((o: any) => o._id === order._id);

        if (freshOrder) {
          console.log(
            `🔄 Polling fresh data for order ${order._id}:`,
            freshOrder,
          );
          setProgress(freshOrder.progress || 0);
          setStatus(freshOrder.status);
          setCompletedAt(freshOrder.completedAt);
        }
      } catch (error) {
        console.error(`Failed to poll order ${order._id}:`, error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [order._id]);

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      case "preparing":
        return "bg-blue-50 border-blue-200";
      case "ready":
        return "bg-green-50 border-green-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  if (compact) {
    return (
      <div
        className={`rounded-xl border-2 p-4 ${getStatusBgColor(status)} shadow-sm`}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-600">
                Table {order.tableNumber}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <p className="font-bold text-slate-900">
              NPR. {order.totalAmount.toFixed(2)}
            </p>
          </div>
          <OrderProgressBar
            progress={progress}
            status={status as any}
            size="sm"
            showPercentage={true}
            showStatus={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 ${getStatusBgColor(status)} shadow-lg overflow-hidden`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">Table {order.tableNumber}</h3>
            <p className="text-sm text-slate-300">
              Ordered at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">Total Amount</p>
            <p className="text-2xl font-black text-amber-400">
              NPR. {order.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Progress Bar */}
        <div>
          <OrderProgressBar
            progress={progress}
            status={status as any}
            size="md"
            showPercentage={true}
            showStatus={true}
            completedAt={completedAt}
          />
        </div>

        {/* Items Details */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900">Order Items</h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-700">
                    {item.name}{" "}
                    <span className="text-slate-500">x{item.qty}</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    NPR. {(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <span className="text-sm font-bold text-slate-600">
            Current Status:
          </span>
          <span
            className={`px-4 py-2 rounded-full font-bold text-sm ${
              status === "ready"
                ? "bg-green-500 text-white"
                : status === "preparing"
                  ? "bg-blue-500 text-white"
                  : "bg-yellow-500 text-white"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingCard;
