import Order from "../models/Order.model.js";
import { Server } from "socket.io";

interface TrackingConfig {
  progressIncrement: number; // How much progress to add per interval (e.g., 2-5%)
  updateInterval: number; // Interval in milliseconds (e.g., 2000ms = 2s)
}

const DEFAULT_CONFIG: TrackingConfig = {
  progressIncrement: 3, // 3% per update
  updateInterval: 2000, // 2 seconds
};

// Map to store active tracking intervals for orders
const activeTrackers = new Map<string, NodeJS.Timeout>();

/**
 * Get status based on progress percentage
 */
export const getStatusByProgress = (
  progress: number,
): "pending" | "preparing" | "ready" => {
  if (progress >= 100) return "ready";
  if (progress >= 10) return "preparing";
  return "pending";
};

/**
 * Start tracking an order's progress
 */
export const startOrderTracking = (
  orderId: string,
  io: Server,
  config: Partial<TrackingConfig> = {},
) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Prevent duplicate tracking
  if (activeTrackers.has(orderId)) {
    console.log(`Order ${orderId} is already being tracked`);
    return;
  }

  console.log(`Starting tracking for order ${orderId}`);

  const interval = setInterval(async () => {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        // Order deleted, stop tracking
        clearInterval(interval);
        activeTrackers.delete(orderId);
        return;
      }

      // Stop tracking if already completed or canceled
      if (
        order.status === "canceled" ||
        order.status === "served" ||
        order.status === "paid"
      ) {
        clearInterval(interval);
        activeTrackers.delete(orderId);
        console.log(`Stopped tracking for order ${orderId} (${order.status})`);
        return;
      }

      // Increment progress
      let newProgress = order.progress + mergedConfig.progressIncrement;

      // Cap at 100%
      if (newProgress > 100) {
        newProgress = 100;
      }

      // Update status based on progress
      const newStatus = getStatusByProgress(newProgress);

      // Set completedAt when reaching 100%
      let completedAt = order.completedAt;
      if (newProgress === 100 && !completedAt) {
        completedAt = new Date();
      }

      // Update order in database
      await Order.findByIdAndUpdate(
        orderId,
        {
          progress: newProgress,
          status: newStatus,
          completedAt,
        },
        { new: true },
      );

      // Emit progress update via Socket.io
      io.emit("order-progress", {
        orderId,
        progress: newProgress,
        status: newStatus,
        completedAt,
        tableNumber: order.tableNumber,
      });

      console.log(
        `Order ${orderId}: Progress ${newProgress}% | Status: ${newStatus}`,
      );

      // Stop tracking when order is ready (100%)
      if (newProgress === 100) {
        clearInterval(interval);
        activeTrackers.delete(orderId);
        console.log(`Order ${orderId} is ready!`);

        // Emit completion event
        io.emit("order-completed", {
          orderId,
          tableNumber: order.tableNumber,
          message: `Order for table ${order.tableNumber} is ready!`,
        });
      }
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      clearInterval(interval);
      activeTrackers.delete(orderId);
    }
  }, mergedConfig.updateInterval);

  activeTrackers.set(orderId, interval);
};

/**
 * Stop tracking a specific order
 */
export const stopOrderTracking = (orderId: string) => {
  const interval = activeTrackers.get(orderId);
  if (interval) {
    clearInterval(interval);
    activeTrackers.delete(orderId);
    console.log(`Stopped tracking for order ${orderId}`);
  }
};

/**
 * Stop all active tracking
 */
export const stopAllTracking = () => {
  activeTrackers.forEach((interval) => clearInterval(interval));
  activeTrackers.clear();
  console.log("Stopped all order tracking");
};

/**
 * Get list of all actively tracked orders
 */
export const getActiveTrackers = (): string[] => {
  return Array.from(activeTrackers.keys());
};
