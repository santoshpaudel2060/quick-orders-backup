"use client";

import KitchenDashboard from "../../components/demo/kitchen-dashboard";

export default function KitchenPage() {
  return <KitchenDashboard onBack={() => (window.location.href = "/")} />;
}
