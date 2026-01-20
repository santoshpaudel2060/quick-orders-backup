// "use client";

// import { useSearchParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import axios from "axios";

// export default function PaymentSuccess() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const data = searchParams.get("data");

//   const [payment, setPayment] = useState<any>(null);
//   const [error, setError] = useState("");
//   const [isExiting, setIsExiting] = useState(false);

//   // Decode payment data
//   useEffect(() => {
//     if (!data) {
//       setError("No payment data received");
//       return;
//     }

//     try {
//       const decoded = JSON.parse(atob(data));
//       setPayment(decoded);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to decode payment data");
//     }
//   }, [data]);

//   // Function to free the table and redirect
//   const exitTable = async () => {
//     if (!payment || isExiting) return;

//     setIsExiting(true);

//     try {
//       await axios.post(`http://localhost:5000/api/tables/free`, {
//         tableNumber: payment.tableNumber,
//       });
//       router.push("/");
//     } catch (err) {
//       console.error("Failed to free table:", err);
//       router.push("/"); // Redirect anyway
//     }
//   };

//   // Auto redirect after 10 seconds
//   useEffect(() => {
//     if (payment) {
//       const timer = setTimeout(() => {
//         exitTable();
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [payment]);

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-red-50">
//         <h1 className="text-red-600 text-xl font-bold">{error}</h1>
//       </div>
//     );
//   }

//   if (!payment) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-yellow-50">
//         <h1 className="text-xl font-bold">⏳ Verifying payment...</h1>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-green-50">
//       <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
//         <h1 className="text-3xl font-black text-green-600 mb-4">
//           Payment Successful ✅
//         </h1>
//         <p className="mb-2 text-slate-700">
//           <strong>Transaction ID:</strong> {payment.transaction_uuid}
//         </p>
//         <p className="mb-6 text-slate-700">
//           <strong>Amount Paid:</strong> NPR {payment.total_amount}
//         </p>
//         <button
//           onClick={exitTable}
//           className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-md"
//         >
//           Exit
//         </button>
//         <p className="mt-4 text-sm text-slate-500">
//           You will be redirected to the home page in 10 seconds...
//         </p>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import axios from "axios";

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
        .post("http://localhost:5000/api/tables/free-by-uuid", {
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
            "Payment successful, but failed to free table. Please inform staff."
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
          onClick={() => (window.location.href = "/")}
          className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
