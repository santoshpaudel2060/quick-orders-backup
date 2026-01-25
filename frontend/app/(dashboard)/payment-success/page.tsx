"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const frontendUrl = process.env.NEXT_PUBLIC_API_URL;

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get("data");

    if (!data) {
      setError("No payment data received");
      setLoading(false);
      return;
    }

    try {
      // Decode eSewa response
      const decoded = JSON.parse(atob(data));
      console.log("Decoded eSewa data:", decoded);

      if (decoded.status !== "COMPLETE") {
        setError("Payment was not completed");
        setLoading(false);
        return;
      }

      const transactionUuid = decoded.transaction_uuid;

      if (!transactionUuid) {
        setError("Missing transaction UUID");
        setLoading(false);
        return;
      }

      // Call your backend to get tableNumber and free the table
      axios
        .post(`${frontendUrl}/api/tables/free-by-uuid`, {
          transactionUuid,
        })
        .then((res) => {
          console.log("Table freed successfully:", res.data);
          // alert(
          //   `Payment successful! Table ${res.data.table.tableNumber} is now free. Thank you! 🎉`
          // );
        })
        .catch((err) => {
          console.error("Failed to free table:", err.response?.data || err);
          alert(
            "Payment successful, but failed to free table. Please inform staff.",
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      console.error("Failed to decode data:", err);
      setError("Invalid payment data");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-2xl">Processing payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <p className="text-2xl text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
        <div className="text-8xl mb-6">✅</div>
        <h1 className="text-4xl font-black text-green-700 mb-4">
          Payment Successful!
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          Thanks for dining with us.
        </p>
        <button
          onClick={() => {
            // Clear all guest session data
            localStorage.removeItem("guestSessionId");
            localStorage.removeItem("guestSession");
            localStorage.removeItem("currentStage");
            localStorage.removeItem("currentTable");

            // Mark session as ended so hook doesn't try to restore
            localStorage.setItem("sessionEnded", "true");

            window.location.href = "/";
          }}
          className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
