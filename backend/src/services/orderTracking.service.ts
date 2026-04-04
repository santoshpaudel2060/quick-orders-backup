import Order from "../models/Order.model.js";
import { Server } from "socket.io";
import type { OrderStatus } from "../models/Order.model.js";

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
// Map to track if a tracking start is in progress (prevent race conditions)
const trackingStartInProgress = new Set<string>();

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

  // Prevent duplicate tracking - check both active trackers and in-progress starts
  if (activeTrackers.has(orderId) || trackingStartInProgress.has(orderId)) {
    console.log(`Order ${orderId} tracking already started or in progress`);
    return;
  }

  // Mark as starting to prevent race conditions
  trackingStartInProgress.add(orderId);

  console.log(`Starting tracking for order ${orderId}`);

  const interval = setInterval(async () => {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        // Order deleted, stop tracking
        clearInterval(interval);
        activeTrackers.delete(orderId);
        trackingStartInProgress.delete(orderId);
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
        trackingStartInProgress.delete(orderId);
        console.log(`Stopped tracking for order ${orderId} (${order.status})`);
        return;
      }

      // Increment progress only if status is still "preparing"
      if (order.status !== "preparing") {
        clearInterval(interval);
        activeTrackers.delete(orderId);
        trackingStartInProgress.delete(orderId);
        console.log(
          `Order ${orderId} is no longer preparing, stopping tracker`,
        );
        return;
      }

      // Increment progress
      let newProgress = order.progress + mergedConfig.progressIncrement;

      // Cap at 95% when status is "preparing" to allow manual status change to "ready"
      if (newProgress > 95) {
        newProgress = 95;
      }

      // Don't update if progress hasn't changed significantly
      if (newProgress === order.progress) {
        return;
      }

      // Update order in database
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          progress: newProgress,
          // Keep existing status - don't auto-update based on progress
        },
        { new: true },
      );

      if (!updatedOrder) return;

      // IMPORTANT: Only emit if we actually updated the progress
      // This prevents duplicate/conflicting events
      io.emit("order-progress", {
        orderId: updatedOrder._id.toString(),
        progress: newProgress,
        status: updatedOrder.status,
        completedAt: updatedOrder.completedAt,
        tableNumber: updatedOrder.tableNumber,
      });

      console.log(
        `Order ${orderId}: Progress ${newProgress}% | Status: ${updatedOrder.status}`,
      );

      // Stop tracking when status becomes "served" or "paid"
      if (
        (updatedOrder.status as OrderStatus) === "served" ||
        (updatedOrder.status as OrderStatus) === "paid"
      ) {
        clearInterval(interval);
        activeTrackers.delete(orderId);
        trackingStartInProgress.delete(orderId);
        console.log(`Order ${orderId} is ${updatedOrder.status}!`);

        // Emit completion event
        io.emit("order-completed", {
          orderId,
          tableNumber: updatedOrder.tableNumber,
          message: `Order for table ${updatedOrder.tableNumber} is ready!`,
        });
      }
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      clearInterval(interval);
      activeTrackers.delete(orderId);
      trackingStartInProgress.delete(orderId);
    }
  }, mergedConfig.updateInterval);

  // Remove from starting set and add to active trackers
  trackingStartInProgress.delete(orderId);
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
    trackingStartInProgress.delete(orderId);
    console.log(`Stopped tracking for order ${orderId}`);
  }
};

/**
 * Stop all active tracking
 */
export const stopAllTracking = () => {
  activeTrackers.forEach((interval) => clearInterval(interval));
  activeTrackers.clear();
  trackingStartInProgress.clear();
  console.log("Stopped all order tracking");
};

/**
 * Get list of all actively tracked orders
 */
export const getActiveTrackers = (): string[] => {
  return Array.from(activeTrackers.keys());
};
