import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface EsewaFormData {
  amount: number;
  tax_amount: number;
  total_amount: number;
  transaction_uuid: string;
  product_code?: string;
  product_service_charge?: number;
  product_delivery_charge?: number;
  success_url?: string;
  failure_url?: string;
  signed_field_names?: string;
  signature?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
}

interface EsewaFormProps {
  deliveryName: string;
  deliveryLocation: string;
  postalCode: string;
  phone: string;
  items: CartItem[];
  totalAmount: number;
  clearCart: () => void;
  onPaymentSuccess?: () => void;
}

const EsewaForm: React.FC<EsewaFormProps> = ({
  deliveryName,
  deliveryLocation,
  postalCode,
  phone,
  items,
  totalAmount,
  clearCart,
  onPaymentSuccess,
}) => {
  const [transactionUUID] = useState<string>(Date.now().toString());
  const [formData, setFormData] = useState<EsewaFormData | null>(null);

  const handlePay = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const orderPayload = {
        userId: user.userId || user._id || user.id,
        deliveryName,
        deliveryLocation,
        postalCode,
        phone,
        items,
        totalAmount,
      };

      // STEP 1: Place order
      await axios.post("http://localhost:4000/api/orders/place", orderPayload);

      // STEP 2: Reduce stock
      for (const item of items) {
        const stockRes = await axios.post(
          "http://localhost:4000/api/product/reduce-stock",
          {
            productId: item.id,
            quantity: item.quantity,
          }
        );

        if (!stockRes.data.success) {
          throw new Error(`Stock update failed for ${item.name}`);
        }
      }

      // Optional callback
      onPaymentSuccess?.();

      toast.success("Order placed! Redirecting to eSewa...");

      // STEP 3: Initiate eSewa payment
      const paymentPayload = {
        amount: totalAmount - 10,
        tax_amount: 10,
        total_amount: totalAmount,
        transaction_uuid: transactionUUID,
      };

      const res = await axios.post<{ formData: EsewaFormData }>(
        "http://localhost:4000/api/esewa/initiate-payment",
        paymentPayload
      );

      setFormData(res.data.formData);

      // STEP 4: Submit form
      setTimeout(() => {
        const form = document.getElementById(
          "esewaForm"
        ) as HTMLFormElement | null;

        form?.submit();
        clearCart();
      }, 500);
    } catch (error: any) {
      console.error("Payment failed:", error);
      toast.error(
        error?.response?.data?.message || "Checkout failed. Try again."
      );
    }
  };

  return (
    <>
      <button
        onClick={handlePay}
        className="bg-green-500 p-2 text-white rounded"
        type="button"
      >
        Pay with eSewa
      </button>

      {formData && (
        <form
          id="esewaForm"
          action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
          method="POST"
          style={{ display: "none" }}
        >
          {Object.entries(formData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ))}
        </form>
      )}
    </>
  );
};

export default EsewaForm;
