"use client";

import { useRouter } from "next/navigation";

export default function PaymentFailure() {
  const router = useRouter();

  const handleRetry = () => {
    router.push("/");
  };

  const handleContactSupport = () => {
    // You can implement contact support logic here
    alert("Please contact our support team at support@quickorders.com");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-red-500">
        {/* Failure Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-4xl font-black mb-2">Payment Failed</h1>
          <p className="text-lg opacity-90">Transaction was not completed</p>
        </div>

        {/* Failure Details */}
        <div className="p-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-black text-red-800 mb-3">
              What happened?
            </h2>
            <ul className="space-y-2 text-sm text-red-700 font-semibold">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Payment was cancelled or declined</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Insufficient balance in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Connection timeout or network issue</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Technical error during transaction</span>
              </li>
            </ul>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-black text-blue-800 mb-2">
              💡 What can you do?
            </h2>
            <ul className="space-y-2 text-sm text-blue-700 font-semibold">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Check your account balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Verify your payment details</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Try a different payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Contact your bank for assistance</span>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
            <p className="text-center text-amber-800 font-bold text-sm">
              ⚠️ No money has been deducted from your account. You can safely
              retry the payment.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg"
            >
              🔄 Retry Payment
            </button>
            <button
              onClick={handleContactSupport}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl transition-all"
            >
              📞 Contact Support
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-black py-3 rounded-xl transition-all"
            >
              Go to Home
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 text-center border-t-2 border-slate-200">
          <p className="text-xs text-slate-500">
            Need help? Contact us at support@quickorders.com
          </p>
        </div>
      </div>
    </div>
  );
}
