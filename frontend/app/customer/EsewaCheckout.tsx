import React, { useEffect, useRef } from "react";

const EsewaCheckout: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <form
      ref={formRef}
      action="https://rc-epay.esewa.com.np/api/epay/main"
      method="POST"
      style={{ display: "none" }}
    >
      <input type="hidden" name="amount" value="100" />
      <input type="hidden" name="tax_amount" value="0" />
      <input type="hidden" name="total_amount" value="100" />
      <input type="hidden" name="transaction_uuid" value="TXN123456789" />
      <input type="hidden" name="product_code" value="YOUR_PRODUCT_CODE" />
      <input
        type="hidden"
        name="success_url"
        value="http://localhost:5173/success"
      />
      <input
        type="hidden"
        name="failure_url"
        value="http://localhost:5173/failure"
      />
    </form>
  );
};

export default EsewaCheckout;
