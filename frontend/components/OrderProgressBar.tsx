import React from "react";

interface OrderProgressBarProps {
  progress: number; // 0-100
  status: "pending" | "preparing" | "ready";
  showPercentage?: boolean;
  showStatus?: boolean;
  size?: "sm" | "md" | "lg";
  completedAt?: Date;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "from-yellow-400 to-yellow-500";
    case "preparing":
      return "from-blue-400 to-blue-500";
    case "ready":
      return "from-green-400 to-green-500";
    default:
      return "from-gray-400 to-gray-500";
  }
};

const getStatusEmoji = (status: string) => {
  switch (status) {
    case "pending":
      return "⏳";
    case "preparing":
      return "👨‍🍳";
    case "ready":
      return "✅";
    default:
      return "❓";
  }
};

const getSizeClasses = (size: string) => {
  switch (size) {
    case "sm":
      return { container: "h-4", text: "text-xs" };
    case "lg":
      return { container: "h-8", text: "text-lg" };
    default:
      return { container: "h-6", text: "text-sm" };
  }
};

export const OrderProgressBar: React.FC<OrderProgressBarProps> = ({
  progress,
  status,
  showPercentage = true,
  showStatus = true,
  size = "md",
  completedAt,
}) => {
  const sizeClasses = getSizeClasses(size);
  const colorGradient = getStatusColor(status);
  const statusEmoji = getStatusEmoji(status);
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="w-full space-y-2">
      {/* Header with status and percentage */}
      {(showStatus || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {showStatus && (
            <div className="flex items-center gap-2">
              <span className="text-lg">{statusEmoji}</span>
              <span className="font-bold text-slate-700">{statusLabel}</span>
            </div>
          )}
          {showPercentage && (
            <span className="text-sm font-bold text-slate-600">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={`w-full ${sizeClasses.container} bg-slate-200 rounded-full overflow-hidden shadow-inner`}
      >
        {/* Progress fill */}
        <div
          className={`h-full bg-linear-to-r ${colorGradient} transition-all duration-500 flex items-center justify-center`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
        </div>
      </div>

      {/* Completion timestamp */}
      {completedAt && (
        <p className="text-xs text-slate-500 mt-1">
          Completed at {new Date(completedAt).toLocaleTimeString()}
        </p>
      )}

      {/* Milestone indicators */}
      <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default OrderProgressBar;
