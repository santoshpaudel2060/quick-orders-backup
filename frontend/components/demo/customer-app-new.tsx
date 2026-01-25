"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import jsQR from "jsqr";
import axios from "axios";
import toast from "react-hot-toast";
import { useGuestSession } from "../../hooks/useGuestSession";

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  _id: string;
  tableNumber: number;
  customerId: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "served";
  totalAmount: number;
  createdAt: string;
}

interface PaymentQRData {
  qrCode: string;
  paymentData: {
    tableNumber: number;
    total: number;
    customerId: string;
    timestamp: string;
  };
}

interface Table {
  _id: string;
  tableNumber: number;
  qrCodeUrl: string;
  status: string;
  currentCustomer: string | null;
  orders: any[];
}

interface EsewaPaymentData {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

const apiURL = process.env.NEXT_PUBLIC_API_URL;

export default function CustomerApp({ onBack }: { onBack?: () => void }) {
  // Guest session management
  const {
    sessionId: guestSessionId,
    session: guestSession,
    createSession: createGuestSession,
    restoreSession: restoreGuestSession,
    updateCartInSession: updateSessionCart,
    endSession: endGuestSession,
    refreshSession: refreshGuestSession,
  } = useGuestSession();

  // Stage management
  const [stage, setStage] = useState<
    | "qr-scan"
    | "name-entry"
    | "menu"
    | "cart"
    | "order-tracking"
    | "bill"
    | "payment"
  >("qr-scan");

  // Check if guest session exists on mount and restore
  useEffect(() => {
    if (guestSessionId && guestSession) {
      // Session was restored from localStorage
      setTableNumber(guestSession.tableNumber);
      setCustomerId(guestSession.customerName);
      setSessionStartTime(new Date(guestSession.sessionStartTime));
      if (guestSession.cart && guestSession.cart.items.length > 0) {
        setCart(guestSession.cart.items);
      }

      // Restore the previous stage from localStorage
      const savedStage = localStorage.getItem("currentStage");
      if (
        savedStage &&
        [
          "qr-scan",
          "name-entry",
          "menu",
          "cart",
          "order-tracking",
          "bill",
          "payment",
        ].includes(savedStage)
      ) {
        setStage(
          savedStage as
            | "qr-scan"
            | "name-entry"
            | "menu"
            | "cart"
            | "order-tracking"
            | "bill"
            | "payment",
        );
      } else {
        setStage("menu");
      }
      toast.success("Session restored! Welcome back.");
    }
  }, [guestSessionId, guestSession]);

  // QR Scanning states
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Menu and cart states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentQR, setPaymentQR] = useState<PaymentQRData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Order tracking states
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order[]>([]);
  const [orderRefreshInterval, setOrderRefreshInterval] =
    useState<NodeJS.Timeout | null>(null);

  // eSewa payment states
  const [esewaPaymentData, setEsewaPaymentData] =
    useState<EsewaPaymentData | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const esewaFormRef = useRef<HTMLFormElement>(null);

  // Save stage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("currentStage", stage);
  }, [stage]);

  // Fetch tables from backend for validation
  const {
    data: tables,
    isLoading: tablesLoading,
    error: tablesError,
    refetch: refetchTables,
  } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await axios.get(`${apiURL}/api/tables/`);
      return res.data;
    },
  });

  // Validate table number exists in database and is available
  const validateTable = (
    tableNum: number,
  ): { valid: boolean; message?: string } => {
    if (!tables) return { valid: false, message: "Loading tables..." };

    const table = tables.find((t) => t.tableNumber === tableNum);

    if (!table) {
      return { valid: false, message: "Table not found" };
    }

    if (table.status === "occupied") {
      return { valid: false, message: "Table is currently occupied" };
    }

    return { valid: true };
  };

  // Occupy table when customer enters their name
  const occupyTable = async (tableNum: number, customerName: string) => {
    try {
      await axios.post(`${apiURL}/api/tables/occupy`, {
        tableNumber: tableNum,
        customerId: customerName,
      });

      // Refetch tables to update the status
      refetchTables();

      console.log(`Table ${tableNum} occupied by ${customerName}`);
      return true;
    } catch (error) {
      console.error("Failed to occupy table:", error);
      toast.error("Failed to occupy table. Please try again.");
      return false;
    }
  };

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      if (stage === "menu") {
        try {
          setLoading(true);
          const response = await axios.get(`${apiURL}/api/menus`);
          setMenuItems(response.data);
        } catch (error) {
          console.error("Failed to fetch menu:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMenu();
  }, [stage]);

  // Fetch my orders when in order-tracking stage
  useEffect(() => {
    const fetchMyOrders = async () => {
      if (
        stage === "order-tracking" &&
        tableNumber &&
        customerId &&
        sessionStartTime
      ) {
        try {
          const response = await axios.get(
            `${apiURL}/api/orders/table/${tableNumber}`,
          );

          const customerOrders = response.data.filter((order: Order) => {
            const orderCreatedAt = new Date(order.createdAt);
            const isMyOrder = order.customerId === customerId;
            const isFromCurrentSession =
              sessionStartTime && orderCreatedAt >= sessionStartTime;

            return isMyOrder && isFromCurrentSession;
          });

          setMyOrders(customerOrders);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        }
      }
    };

    fetchMyOrders();

    if (stage === "order-tracking") {
      const interval = setInterval(fetchMyOrders, 3000);
      setOrderRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (orderRefreshInterval) {
      clearInterval(orderRefreshInterval);
      setOrderRefreshInterval(null);
    }
  }, [stage, tableNumber, customerId, sessionStartTime]);

  // Handle QR scan detection
  const handleQRDetected = (qrData: string) => {
    console.log("QR Detected:", qrData);

    try {
      const url = new URL(qrData);
      const tableParam = url.searchParams.get("table");

      if (tableParam) {
        const tableNum = parseInt(tableParam);

        // Validate table exists and is available
        const validation = validateTable(tableNum);

        if (!validation.valid) {
          toast.error(validation.message || "Invalid table");
          return;
        }

        setTableNumber(tableNum);
        setSessionStartTime(new Date());
        console.log("QR scanned for table:", tableNum);

        // Move to name entry stage
        setStage("name-entry");
        setCameraActive(false);
        toast.success(`Table ${tableNum} scanned successfully!`);
      } else {
        toast.error("Invalid QR code. No table number found.");
      }
    } catch (err) {
      toast.error("Invalid QR code format.");
    }
  };

  // QR Code scanning logic
  useEffect(() => {
    let animationFrame: number;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    const scanLoop = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        if (!canvas) {
          canvas = document.createElement("canvas");
          ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        }

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRDetected(code.data);
        }
      }
      animationFrame = requestAnimationFrame(scanLoop);
    };

    if (cameraActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
          animationFrame = requestAnimationFrame(scanLoop);
        })
        .catch((err) => {
          console.error("Camera error:", err);
          toast.error("Camera access denied. Please allow camera permission.");
        });
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [cameraActive, tables]);

  // Handle photo upload for QR scanning
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRDetected(code.data);
        } else {
          toast.error("No QR code detected in the image.");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle customer name submission
  const handleNameSubmit = async () => {
    if (!customerId.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!tableNumber) {
      toast.error("Table number not found");
      return;
    }

    // Create guest session in backend
    const sessionCreated = await createGuestSession(tableNumber, customerId);

    if (!sessionCreated) {
      toast.error("Failed to create session");
      return;
    }

    // Occupy the table
    const success = await occupyTable(tableNumber, customerId);

    if (success) {
      toast.success(
        `Welcome ${customerId}! Table ${tableNumber} is now yours.`,
      );
      setStage("menu");
    } else {
      toast.error("Failed to occupy table");
    }
  };

  // Cart management functions
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((cartItem) => cartItem._id === item._id);

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item._id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(
        cart.map((item) =>
          item._id === itemId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateGrandTotal = () => {
    return myOrders
      .filter((order) => order.status === "served")
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  const handleCheckout = async () => {
    if (!tableNumber || !customerId) {
      alert("Please enter your name");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      // Save cart to guest session
      const cartTotal = calculateTotal();
      await updateSessionCart(cart, cartTotal);

      await axios.post(
        `${apiURL}/api/orders/add`,
        {
          tableNumber: tableNumber,
          customerId,
          items: cart.map((item) => ({
            name: item.name,
            qty: item.quantity,
            price: item.price,
          })),
          sessionId: guestSessionId, // Include session ID
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "X-Guest-Session-Id": guestSessionId || "",
          },
        },
      );

      setCart([]);
      setStage("order-tracking");
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed. Please try again.");
    }
  };

  const handleGetBill = () => {
    setStage("bill");
  };

  const handleProceedToPayment = async () => {
    const total = calculateGrandTotal();

    try {
      const qrResponse = await axios.post(`${apiURL}/api/orders/generate-qr`, {
        tableNumber: tableNumber,
        total,
        customerId,
      });

      setPaymentQR(qrResponse.data);
      setStage("payment");
    } catch (error) {
      console.error("Failed to generate payment QR:", error);
      alert("Failed to generate payment. Please try again.");
    }
  };

  const cancelOrder = async (orderId, status) => {
    if (status !== "pending") {
      toast.error("Only pending orders can be cancelled");
      return;
    }

    if (!confirm("Are you sure you want to cancel this order?")) return;

    const originalOrders = [...order];
    try {
      // Optimistic UI update
      setOrder(order.filter((o) => o._id !== orderId));

      await axios.delete(`${apiURL}/api/orders/${orderId}`);

      toast.success("Order cancelled successfully");
    } catch (err) {
      setOrder(originalOrders);
      toast.error("Failed to cancel order");
    }
  };

  const handleEsewaPayment = async () => {
    if (!tableNumber || !customerId) {
      alert("Missing table or customer information");
      return;
    }

    setPaymentLoading(true);

    try {
      const grandTotal = calculateGrandTotal();
      const finalTotal = grandTotal;

      const response = await axios.post(`${apiURL}/api/payments/initiate`, {
        tableNumber,
        customerId,
        totalAmount: grandTotal,
        grandTotal: finalTotal,
      });

      if (response.data.success) {
        const paymentData = response.data.paymentData;
        setEsewaPaymentData(paymentData);

        setTimeout(() => {
          if (esewaFormRef.current) {
            esewaFormRef.current.submit();
          }
        }, 100);
      } else {
        alert("Failed to initiate payment");
      }
    } catch (error) {
      console.error("eSewa payment error:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentComplete = async () => {
    if (!tableNumber || !customerId) {
      alert("Missing table or customer information");
      return;
    }

    try {
      console.log("Starting payment completion process...");
      console.log("Table:", tableNumber, "Customer:", customerId);

      try {
        const deleteResponse = await axios.delete(
          `${apiURL}/api/orders/customer/${tableNumber}/${customerId}`,
        );
        console.log("Orders deleted:", deleteResponse.data);
      } catch (deleteError) {
        console.error("Failed to delete orders:", deleteError);
      }

      try {
        await axios.post(`${apiURL}/api/tables/free`, {
          tableNumber: tableNumber,
          customerId: customerId,
        });
        console.log("Table freed successfully");
      } catch (freeError) {
        console.error("Failed to free table:", freeError);
        try {
          await axios.post(`${apiURL}/api/tables/free/${tableNumber}`);
          console.log("Table freed via alternative endpoint");
        } catch (altError) {
          console.error("Alternative free endpoint also failed:", altError);
        }
      }

      const currentTableNumber = tableNumber;
      const currentCustomerId = customerId;

      // End guest session
      if (guestSessionId) {
        await endGuestSession();
      }

      setCart([]);
      setCustomerId("");
      setPaymentQR(null);
      setMyOrders([]);
      setSelectedCategory("all");
      setSearchTerm("");
      setEsewaPaymentData(null);
      setMenuItems([]);
      setTableNumber(null);

      setSessionStartTime(null);

      // Clear localStorage session data
      localStorage.removeItem("guestSessionId");
      localStorage.removeItem("guestSession");
      localStorage.removeItem("currentStage");

      if (orderRefreshInterval) {
        clearInterval(orderRefreshInterval);
        setOrderRefreshInterval(null);
      }

      setStage("qr-scan");
      toast.success("Thank you! Table has been freed.");
    } catch (error) {
      console.error("Failed to complete payment process:", error);

      // End guest session even on error
      if (guestSessionId) {
        await endGuestSession();
      }

      setCart([]);
      setCustomerId("");
      setPaymentQR(null);
      setMyOrders([]);
      setSelectedCategory("all");
      setSearchTerm("");
      setEsewaPaymentData(null);
      setMenuItems([]);
      setTableNumber(null);

      setSessionStartTime(null);

      if (orderRefreshInterval) {
        clearInterval(orderRefreshInterval);
        setOrderRefreshInterval(null);
      }

      setStage("qr-scan");
    }
  };

  const categories = [
    "all",
    ...new Set(menuItems.map((item) => item.category)),
  ];

  const allOrdersServed =
    myOrders.length > 0 && myOrders.every((order) => order.status === "served");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-700 border-red-300";
      case "preparing":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "ready":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "served":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // ========================
  // QR SCAN STAGE
  // ========================
  if (stage === "qr-scan") {
    if (tablesLoading) return <div>Loading tables...</div>;
    if (tablesError) return <div>Error loading tables</div>;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black text-white mb-4">QuickOrders</h1>
            <p className="text-xl text-slate-300 font-semibold">
              Scan your table QR code to start ordering
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-10 border-2 border-amber-100 mb-8">
            {!cameraActive ? (
              <div className="space-y-6 text-center">
                <h2 className="text-2xl font-black text-slate-900 mb-6">
                  Step 1: Scan Your Table QR
                </h2>

                <div className="mb-6">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="border-2 border-slate-300 rounded-xl px-4 py-2 w-full"
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Or upload a photo of your table QR code
                  </p>
                </div>

                <button
                  onClick={() => setCameraActive(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-5 rounded-2xl text-lg shadow-lg transition-all"
                >
                  Open Camera to Scan
                </button>

                {onBack && (
                  <button
                    onClick={onBack}
                    className="w-full px-6 py-3 text-slate-700 font-bold border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all mt-4"
                  >
                    Back
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">
                    Scanning QR Code
                  </h2>
                  <p className="text-slate-600 font-semibold">
                    Point your camera at the QR code
                  </p>
                </div>
                <div className="bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-300 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-4 border-green-400 rounded-2xl shadow-lg animate-pulse" />
                  </div>
                </div>
                <button
                  onClick={() => setCameraActive(false)}
                  className="w-full px-6 py-3 text-slate-700 font-bold border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all mt-4"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // NAME ENTRY STAGE (NEW)
  // ========================
  if (stage === "name-entry") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-10 border-2 border-amber-100">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">👤</div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">
                Welcome to Table {tableNumber}
              </h1>
              <p className="text-slate-600 font-semibold">
                Please enter your name to continue
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-semibold text-lg"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleNameSubmit();
                    }
                  }}
                />
              </div>

              <button
                onClick={handleNameSubmit}
                disabled={!customerId.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Menu
              </button>

              <button
                onClick={() => {
                  setTableNumber(null);
                  setCustomerId("");
                  setStage("qr-scan");
                }}
                className="w-full px-6 py-3 text-slate-700 font-bold border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
              >
                ← Scan Different Table
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // MENU STAGE
  // ========================
  if (stage === "menu") {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-black mb-4">⏳ Loading menu...</p>
          </div>
        </div>
      );
    }
    const filteredItems = menuItems.filter((item) => {
      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      const matchSearch =
        searchTerm.trim() === "" ||
        item.name.toLowerCase().startsWith(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="sticky top-0 z-20 bg-white border-b-4 border-amber-500 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🍽️</div>
                <div>
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
                    Table {tableNumber} • {customerId}
                  </p>
                  <h1 className="text-4xl font-black text-slate-900">
                    Quick Orders
                  </h1>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                {myOrders.length > 0 && (
                  <button
                    onClick={() => setStage("order-tracking")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg"
                  >
                    📋 Track Orders
                  </button>
                )}
                {cart.length > 0 && (
                  <button
                    onClick={() => setStage("cart")}
                    className="relative bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-black hover:shadow-lg transition-all flex items-center gap-2 shadow-md"
                  >
                    <span className="text-2xl">🛒</span>
                    <span className="text-lg">{cart.length}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search items"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-semibold shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8 flex gap-3 overflow-x-auto pb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSearchTerm("");
                }}
                className={`px-6 py-3 font-black rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-amber-500 text-white shadow-lg scale-105"
                    : "bg-white text-slate-900 border-2 border-slate-200 hover:border-amber-500"
                }`}
              >
                {category === "all" ? "🍽️ All" : `📌 ${category}`}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="h-48 bg-slate-200 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6">
                  <p className="text-xs font-black text-amber-600 uppercase tracking-wide mb-2">
                    {item.category}
                  </p>
                  <h3 className="text-xl font-black text-slate-900 mb-4">
                    {item.name}
                  </h3>

                  <div className="flex justify-between items-center">
                    <p className="text-3xl font-black text-amber-600">
                      NPR. {item.price.toFixed(2)}
                    </p>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3 px-4 rounded-xl transition-all shadow-lg"
                    >
                      ➕ Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <p className="text-center text-xl font-bold text-slate-600">
              ❌ No items found
            </p>
          )}
        </div>
      </div>
    );
  }

  // All other stages remain the same...
  // [Rest of your code for cart, order-tracking, bill, payment stages]

  if (stage === "cart") {
    const total = calculateTotal();

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="sticky top-0 z-20 bg-white border-b-4 border-amber-500 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-black text-slate-900">
                🛒 Your Cart
              </h1>
              <button
                onClick={() => setStage("menu")}
                className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all"
              >
                ← Back to Menu
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {cart.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center shadow-lg">
              <p className="text-3xl font-black text-slate-600 mb-4">
                🛒 Your cart is empty
              </p>
              <button
                onClick={() => setStage("menu")}
                className="bg-amber-500 text-white font-black py-3 px-8 rounded-xl hover:bg-amber-600 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="h-32 bg-slate-200 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-600 font-bold">
                        {item.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1)
                        }
                        className="bg-red-500 text-white font-black py-2 px-4 rounded-lg hover:bg-red-600"
                      >
                        −
                      </button>
                      <p className="text-2xl font-black text-slate-900 w-8 text-center">
                        {item.quantity}
                      </p>
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1)
                        }
                        className="bg-green-500 text-white font-black py-2 px-4 rounded-lg hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-amber-600 mb-3">
                        NPR. {(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="bg-slate-300 hover:bg-slate-400 text-slate-900 font-black py-2 px-4 rounded-lg transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-8 shadow-lg text-white">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-2xl font-black">Total</p>
                  <p className="text-3xl font-black">NPR. {total.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setStage("menu")}
                    className="bg-white text-amber-600 font-black py-4 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    ← Continue Shopping
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl transition-all shadow-lg"
                  >
                    ✓ Place Order
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === "order-tracking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="sticky top-0 z-20 bg-white border-b-4 border-blue-500 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-black text-slate-900">
                  📋 Order Tracking
                </h1>
                <p className="text-sm text-slate-600 mt-2">
                  Table {tableNumber} • {customerId}
                </p>
              </div>
              <button
                onClick={() => setStage("menu")}
                className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all"
              >
                ← Back to Menu
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center shadow-lg">
              <p className="text-3xl font-black text-slate-600 mb-4">
                📋 No orders yet
              </p>
              <button
                onClick={() => setStage("menu")}
                className="bg-blue-500 text-white font-black py-3 px-8 rounded-xl hover:bg-blue-600 transition-all"
              >
                Start Ordering
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Order #{order._id.slice(-6)}
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        NPR. {order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-black uppercase border-2 ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="border-t-2 border-slate-100 pt-4">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between py-2 text-sm"
                      >
                        <span className="font-semibold">
                          {item.qty}x {item.name}
                        </span>
                        <span className="font-black text-amber-600">
                          NPR. {(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <button
                  onClick={() => setStage("menu")}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl transition-all shadow-lg"
                >
                  ➕ Order More
                </button>

                {myOrders.map((o) =>
                  o.status === "pending" ? (
                    <button
                      key={o._id}
                      onClick={() => cancelOrder(o._id, o.status)}
                      className="bg-red-500 hover:bg-red-600 text-white font-black py-2 px-4 rounded-xl transition-all shadow-lg"
                    >
                      ❌ Cancel Order
                    </button>
                  ) : (
                    <button
                      key={o._id}
                      disabled
                      className="bg-gray-400 text-white font-black py-2 px-4 rounded-xl cursor-not-allowed"
                    >
                      ❌ Cancel Order
                    </button>
                  ),
                )}

                {allOrdersServed && (
                  <>
                    <button
                      onClick={handleGetBill}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl transition-all shadow-lg"
                    >
                      🧾 Get Bill
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      className="bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl transition-all shadow-lg"
                    >
                      💳 Pay Now
                    </button>
                  </>
                )}
              </div>

              {!allOrdersServed && (
                <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-6 text-center">
                  <p className="text-blue-800 font-bold">
                    ⏱️ Waiting for all orders to be served before payment...
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Auto-refreshing every 3 seconds
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === "bill") {
    const grandTotal = calculateGrandTotal();
    const finalTotal = grandTotal;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-500">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-center text-white">
            <h1 className="text-4xl font-black mb-2">🧾 BILL</h1>
            <p className="text-lg opacity-90">Quick Orders Restaurant</p>
          </div>

          <div className="p-8">
            <div className="flex justify-between mb-6 pb-4 border-b-2 border-slate-200">
              <div>
                <p className="text-sm text-slate-600">Table Number</p>
                <p className="text-2xl font-black text-slate-900">
                  {tableNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Customer</p>
                <p className="text-2xl font-black text-slate-900">
                  {customerId}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-lg font-black text-slate-900 mb-4">
                Order Items
              </p>
              {myOrders
                .filter((order) => order.status === "served")
                .map((order) => (
                  <div key={order._id} className="mb-4">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between py-2 border-b border-slate-100"
                      >
                        <span className="font-semibold">
                          {item.qty}x {item.name}
                        </span>
                        <span className="font-black text-amber-600">
                          NPR. {(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-6 space-y-3">
              <div className="flex justify-between text-2xl pt-3 border-t-2 border-slate-300">
                <span className="font-black">TOTAL</span>
                <span className="font-black text-green-600">
                  NPR. {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              {new Date().toLocaleString()}
            </p>
          </div>

          <div className="px-8 py-6 bg-slate-50 border-t-2 border-slate-200 space-y-3">
            <button
              onClick={handleProceedToPayment}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 rounded-xl transition-all shadow-lg text-lg"
            >
              💳 Proceed to Payment
            </button>
            <button
              onClick={() => setStage("order-tracking")}
              className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-black py-3 rounded-xl transition-all"
            >
              ← Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "payment" && paymentQR) {
    const grandTotal = calculateGrandTotal();
    const finalTotal = grandTotal;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        {esewaPaymentData && (
          <form
            ref={esewaFormRef}
            action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
            method="POST"
            style={{ display: "none" }}
          >
            <input
              type="text"
              name="amount"
              value={esewaPaymentData.amount}
              readOnly
            />
            <input
              type="text"
              name="tax_amount"
              value={esewaPaymentData.tax_amount}
              readOnly
            />
            <input
              type="text"
              name="total_amount"
              value={esewaPaymentData.total_amount}
              readOnly
            />
            <input
              type="text"
              name="transaction_uuid"
              value={esewaPaymentData.transaction_uuid}
              readOnly
            />
            <input
              type="text"
              name="product_code"
              value={esewaPaymentData.product_code}
              readOnly
            />
            <input
              type="text"
              name="product_service_charge"
              value={esewaPaymentData.product_service_charge}
              readOnly
            />
            <input
              type="text"
              name="product_delivery_charge"
              value={esewaPaymentData.product_delivery_charge}
              readOnly
            />
            <input
              type="text"
              name="success_url"
              value={esewaPaymentData.success_url}
              readOnly
            />
            <input
              type="text"
              name="failure_url"
              value={esewaPaymentData.failure_url}
              readOnly
            />
            <input
              type="text"
              name="signed_field_names"
              value={esewaPaymentData.signed_field_names}
              readOnly
            />
            <input
              type="text"
              name="signature"
              value={esewaPaymentData.signature}
              readOnly
            />
          </form>
        )}

        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-green-500">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
            <p className="text-lg font-black opacity-90 mb-2">
              PAYMENT REQUIRED
            </p>
            <p className="text-5xl font-black">NPR. {finalTotal.toFixed(2)}</p>
          </div>

          <div className="p-8">
            <p className="text-center text-sm font-black text-slate-600 mb-6 uppercase tracking-widest">
              Choose Payment Method
            </p>

            <div className="mb-6">
              <button
                onClick={handleEsewaPayment}
                disabled={paymentLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black py-5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg border-2 border-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                    </svg>
                    Pay through eSewa
                  </>
                )}
              </button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Secure payment powered by eSewa
              </p>
            </div>
          </div>

          <div className="px-8 pb-6 space-y-4 bg-slate-50">
            <div className="text-center">
              <p className="text-sm text-slate-600 font-bold">Table Number</p>
              <p className="text-3xl font-black text-amber-600">
                {tableNumber}
              </p>
            </div>

            <div className="border-t-2 border-slate-200 pt-4">
              <p className="text-xs text-slate-600 font-black uppercase tracking-widest mb-2">
                Total Orders: {myOrders.length}
              </p>
              <div className="text-sm space-y-1">
                {myOrders.map((order) => (
                  <div
                    key={order._id}
                    className="mb-6 p-4 bg-white rounded-xl shadow"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold text-slate-700">
                        Order #{order._id.slice(-6)}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === "served"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <p>
                            <span className="font-semibold">{item.qty}x</span>{" "}
                            {item.name}
                          </p>
                          <p>NPR. {(item.price * item.qty).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between border-t pt-3">
                      <p className="font-black text-lg">Total</p>
                      <p className="font-black text-amber-600 text-xl">
                        NPR. {order.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 text-right">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-white border-t-2 border-slate-200 space-y-3">
            <button
              onClick={() => setStage("bill")}
              className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-black py-3 rounded-xl transition-all"
            >
              ← Back to Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
