"use client";

import KitchenDashboard from "../../components/dashboard/kitchen-dashboard";

export default function KitchenPage() {
  return <KitchenDashboard onBack={() => (window.location.href = "/")} />;
}
