"use client";

import CustomerApp from "../../components/dashboard/customer-app-new";

export default function CustomerPage() {
  return <CustomerApp onBack={() => (window.location.href = "/")} />;
}
