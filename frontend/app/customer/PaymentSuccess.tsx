"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get data from URL query params
        const data = searchParams.get("data");

        if (!data) {
          setError("No payment data received");
          setVerifying(false);
          return;
        }

        // Verify payment with backend
        const response = await axios.get(
          `${API_BASE_URL}/payment/verify?data=${data}`
        );

        if (response.data.success) {
          setVerified(true);
          setTransactionDetails(response.data.transaction);
        } else {
          setError(response.data.message || "Payment verification failed");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.response?.data?.message || "Failed to verify payment");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    router.push("/");
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">
            Verifying Payment...
          </h1>
          <p className="text-slate-600 font-semibold">
            Please wait while we confirm your payment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-red-500">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 text-center text-white">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-4xl font-black mb-2">Payment Failed</h1>
          </div>

          <div className="p-8 text-center">
            <p className="text-lg text-slate-700 font-semibold mb-6">{error}</p>

            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-black py-3 rounded-xl transition-all"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verified && transactionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-green-500">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h1 className="text-4xl font-black mb-2">Payment Successful!</h1>
            <p className="text-lg opacity-90">Thank you for your payment</p>
          </div>

          {/* Transaction Details */}
          <div className="p-8">
            <div className="bg-slate-50 rounded-2xl p-6 mb-6 space-y-4">
              <div className="flex justify-between items-center border-b-2 border-slate-200 pb-3">
                <span className="text-sm font-bold text-slate-600">
                  Transaction ID
                </span>
                <span className="text-sm font-black text-slate-900">
                  {transactionDetails.transactionUuid?.slice(-12) || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center border-b-2 border-slate-200 pb-3">
                <span className="text-sm font-bold text-slate-600">
                  Transaction Code
                </span>
                <span className="text-sm font-black text-slate-900">
                  {transactionDetails.transactionCode || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center border-b-2 border-slate-200 pb-3">
                <span className="text-sm font-bold text-slate-600">Amount</span>
                <span className="text-2xl font-black text-green-600">
                  Rs. {transactionDetails.amount}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">Status</span>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase">
                  {transactionDetails.status}
                </span>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
              <p className="text-center text-green-800 font-bold text-sm">
                🎉 Your payment has been processed successfully. Your table has
                been freed. Thank you for dining with us!
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 rounded-xl transition-all shadow-lg"
              >
                Continue
              </button>
              <button
                onClick={() => window.print()}
                className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-black py-3 rounded-xl transition-all"
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-6 text-center border-t-2 border-slate-200">
            <p className="text-xs text-slate-500">
              Transaction completed at {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
