import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface OrderProgress {
  orderId: string;
  progress: number; // 0-100%
  status: "pending" | "preparing" | "ready";
  completedAt?: Date;
  tableNumber: number;
}

interface UseOrderTrackingReturn {
  socket: Socket | null;
  orderProgress: Map<string, OrderProgress>;
  isConnected: boolean;
  subscribeToOrder: (orderId: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
  getOrderProgress: (orderId: string) => OrderProgress | undefined;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const useOrderTracking = (): UseOrderTrackingReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orderProgress, setOrderProgress] = useState<
    Map<string, OrderProgress>
  >(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [subscribedOrders, setSubscribedOrders] = useState<Set<string>>(
    new Set(),
  );

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to order tracking socket:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from order tracking socket");
      setIsConnected(false);
    });

    // Listen for order progress updates
    newSocket.on("order-progress", (data: OrderProgress) => {
      console.log("📊 Order progress received:", data);
      setOrderProgress((prev) => {
        const updated = new Map(prev);
        updated.set(data.orderId, data);
        return updated;
      });
    });

    // Legacy: Listen for status change events if still being sent
    newSocket.on("order-status-changed", (data: any) => {
      console.log("📋 Order status changed:", data.orderId, data.status);
      // Only update status if progress data doesn't exist
      // Otherwise let order-progress handle everything
      setOrderProgress((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(data.orderId);
        if (!existing) {
          updated.set(data.orderId, {
            orderId: data.orderId,
            progress: 5, // Start at 5% for preparing
            status: data.status,
            tableNumber: data.tableNumber,
          });
        } else {
          updated.set(data.orderId, {
            ...existing,
            status: data.status,
          });
        }
        return updated;
      });
    });

    // Listen for order completion
    newSocket.on(
      "order-completed",
      (data: { orderId: string; tableNumber: number; message: string }) => {
        console.log(`Order completed: ${data.message}`);
        // Progress will already be at 100% from order-progress event
      },
    );

    // Listen for new orders
    newSocket.on("new-order", (order: any) => {
      console.log("New order received:", order);
      // Initialize with 0% progress
      setOrderProgress((prev) => {
        const updated = new Map(prev);
        if (!updated.has(order._id)) {
          updated.set(order._id, {
            orderId: order._id,
            progress: 0,
            status: "pending",
            tableNumber: order.tableNumber,
          });
        }
        return updated;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Subscribe to a specific order
  const subscribeToOrder = useCallback((orderId: string) => {
    setSubscribedOrders((prev) => new Set([...prev, orderId]));
  }, []);

  // Unsubscribe from a specific order
  const unsubscribeFromOrder = useCallback((orderId: string) => {
    setSubscribedOrders((prev) => {
      const updated = new Set(prev);
      updated.delete(orderId);
      return updated;
    });
  }, []);

  // Get progress for a specific order - don't memoize to ensure fresh data on every render
  const getOrderProgress = (orderId: string) => {
    return orderProgress.get(orderId);
  };

  return {
    socket,
    orderProgress,
    isConnected,
    subscribeToOrder,
    unsubscribeFromOrder,
    getOrderProgress,
  };
};
