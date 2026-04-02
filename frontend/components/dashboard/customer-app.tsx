import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import jsQR from "jsqr";
import axios from "axios";
import toast from "react-hot-toast";
import { useOrderTracking } from "../../hooks/useOrderTracking";
import OrderProgressBar from "../OrderProgressBar";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Table {
  _id: string;
  tableNumber: number;
  qrCodeUrl: string;
  status: string;
  currentCustomer: string | null;
  orders: any[];
}

const mockMenuItems = [
  {
    id: 1,
    name: "Margherita Pizza",
    price: 12.99,
    category: "Main",
    image: "/margherita-pizza-restaurant.jpg",
  },
  {
    id: 2,
    name: "Caesar Salad",
    price: 8.99,
    category: "Appetizer",
    image: "/caesar-salad-fresh-vegetables.jpg",
  },
  {
    id: 3,
    name: "Grilled Salmon",
    price: 18.99,
    category: "Main",
    image: "/grilled-salmon-fillet.jpg",
  },
  {
    id: 4,
    name: "Beef Burger",
    price: 14.99,
    category: "Main",
    image: "/beef-burger-gourmet.jpg",
  },
  {
    id: 5,
    name: "Chocolate Cake",
    price: 6.99,
    category: "Dessert",
    image: "/chocolate-cake-dessert.jpg",
  },
  {
    id: 6,
    name: "Ice Cream",
    price: 5.99,
    category: "Dessert",
    image: "/ice-cream-vanilla-chocolate.jpg",
  },
  {
    id: 7,
    name: "Coca Cola",
    price: 2.99,
    category: "Beverage",
    image: "/cola-soft-drink.jpg",
  },
  {
    id: 8,
    name: "Cappuccino",
    price: 4.99,
    category: "Beverage",
    image: "/cappuccino-coffee-latte.jpg",
  },
];

const generateQRCodeUrl = (text: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    text,
  )}`;
};

export default function CustomerApp({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<
    "qr-scan" | "menu" | "cart" | "checkout" | "order-placed"
  >("qr-scan");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("Main");
  const [customerId, setCustomerId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Order tracking state
  const {
    getOrderProgress,
    subscribeToOrder,
    orderProgress: hookOrderProgress,
  } = useOrderTracking();
  const [orderProgress, setOrderProgress] = useState(0);
  const [orderStatus, setOrderStatus] = useState("pending");

  // Subscribe to order updates when order is placed
  useEffect(() => {
    if (placedOrderId && stage === "order-placed") {
      console.log("Subscribing to order:", placedOrderId);
      subscribeToOrder(placedOrderId);
    }
  }, [placedOrderId, stage, subscribeToOrder]);

  // Update progress display when order progress changes
  useEffect(() => {
    if (placedOrderId) {
      const trackingData = getOrderProgress(placedOrderId);
      if (trackingData) {
        console.log("✅ Order progress updated:", trackingData);
        setOrderProgress(trackingData.progress);
        setOrderStatus(trackingData.status);
      } else {
        console.log("⏳ Waiting for order progress data for:", placedOrderId);
      }
    }
  }, [placedOrderId, hookOrderProgress, getOrderProgress]);

  // Polling fallback for customer app - fetch order directly every 2 seconds
  useEffect(() => {
    if (!placedOrderId || stage !== "order-placed") {
      console.log(
        "❌ Polling skipped - placedOrderId:",
        placedOrderId,
        "stage:",
        stage,
      );
      return;
    }

    if (!tableNumber) {
      console.log("❌ Polling skipped - tableNumber is null");
      return;
    }

    console.log(
      "✅ Starting polling for order:",
      placedOrderId,
      "table:",
      tableNumber,
    );

    const pollInterval = setInterval(async () => {
      try {
        const url = `http://localhost:5000/api/orders/table/${tableNumber}`;
        console.log("📡 Polling URL:", url);
        const response = await axios.get(url);
        console.log("📊 API Response:", response.data);

        const orders = Array.isArray(response.data)
          ? response.data
          : [response.data];
        console.log("📦 Orders array:", orders);

        const currentOrder = orders.find((o: any) => o._id === placedOrderId);
        console.log("🎯 Current order found:", currentOrder);

        if (currentOrder) {
          console.log(
            "🔄 Setting progress to:",
            currentOrder.progress,
            "status:",
            currentOrder.status,
          );
          setOrderProgress(currentOrder.progress || 0);
          setOrderStatus(currentOrder.status || "pending");
        }
      } catch (error) {
        console.error("❌ Polling error:", error);
      }
    }, 2000);

    return () => {
      console.log("🛑 Stopping polling");
      clearInterval(pollInterval);
    };
  }, [placedOrderId, tableNumber, stage]);

  const categories = Array.from(
    new Set(mockMenuItems.map((item) => item.category)),
  );
  const filteredItems = mockMenuItems.filter(
    (item) => item.category === selectedCategory,
  );

  // -------------------------
  // Fetch tables from backend
  // -------------------------
  const {
    data: tables,
    isLoading,
    error,
  } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/tables/");
      return res.data;
    },
  });

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
          console.log("QR Detected:", code.data); // 🔍 Log what we read

          // Extract table number from URL, e.g., table_3.png
          // const urlMatch = code.data.match(/table_(\d+)\.png/i);
          // if (urlMatch) {
          //   const tableNum = parseInt(urlMatch[1]);
          //   console.log("Table number recognized:", tableNum);
          //   setTableNumber(tableNum);
          //   setStage("menu");
          //   setCameraActive(false);
          // } else {
          //   console.warn("QR scanned but table number not recognized");
          // }

          try {
            const url = new URL(code.data);
            const tableParam = url.searchParams.get("table");

            if (tableParam) {
              const tableNum = parseInt(tableParam);
              setTableNumber(tableNum);
              localStorage.setItem("tableNumber", tableNum.toString());
              setStage("menu");
              setCameraActive(false);
              console.log("Table number recognized:", tableNum);
            } else {
              console.warn("QR scanned but table number not recognized");
            }
          } catch (err) {
            console.warn("Invalid QR URL:", code.data);
          }
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
        .catch((err) => console.error("Camera error:", err));
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  const addToCart = (item: (typeof mockMenuItems)[0]) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity === 0) setCart(cart.filter((c) => c.id !== id));
    else setCart(cart.map((c) => (c.id === id ? { ...c, quantity } : c)));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const submitOrder = () => {
    if (tableNumber && cart.length > 0) setStage("checkout");
  };
  // Submit order to backend
  const handlePlaceOrder = async () => {
    try {
      setIsSubmittingOrder(true);

      // Generate a simple customer ID if not exists
      const finalCustomerId = customerId || `customer-${Date.now()}`;
      setCustomerId(finalCustomerId);

      // Prepare order items
      const orderItems = cart.map((item) => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
      }));

      // Submit order to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/add`,
        {
          tableNumber,
          customerId: finalCustomerId,
          items: orderItems,
          sessionId: sessionId || undefined,
        },
      );

      if (response.data.order) {
        const orderId = response.data.order._id;
        setPlacedOrderId(orderId);
        toast.success("Order placed successfully!");
        setStage("order-placed");
      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      const message =
        error.response?.data?.message ||
        "Failed to place order. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };
  const paymentQRCode = generateQRCodeUrl(
    `PAYMENT_${tableNumber}_${total.toFixed(2)}`,
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas to draw the image
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log("QR Detected from photo:", code.data);
          try {
            const url = new URL(code.data);
            const tableParam = url.searchParams.get("table");

            if (tableParam) {
              const tableNum = parseInt(tableParam);
              setTableNumber(tableNum);
              localStorage.setItem("tableNumber", tableNum.toString());
              setStage("menu");
              console.log("Table number recognized:", tableNum);
            } else {
              console.warn("QR scanned but table number not recognized");
            }
          } catch (err) {
            console.warn("Invalid QR URL:", code.data);
          }
        } else {
          console.warn("No QR code detected in the uploaded photo");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ------------------------
  // QR SCAN STAGE
  // ------------------------

  if (stage === "qr-scan") {
    if (isLoading) return <div>Loading tables...</div>;
    if (error) return <div>Error loading tables</div>;

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

                {/* Upload QR Image */}
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

                {/* Open Camera */}
                <button
                  onClick={() => setCameraActive(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-5 rounded-2xl text-lg shadow-lg transition-all"
                >
                  Open Camera to Scan
                </button>
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

  // Menu Stage
  if (stage === "menu") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-20 bg-white border-b-2 border-slate-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
                Table Service
              </p>
              <h1 className="text-4xl font-black text-slate-900">
                Table {tableNumber}
              </h1>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setStage("cart")}
                className="relative bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-black hover:shadow-lg transition-all flex items-center gap-2 shadow-md"
              >
                <span className="text-2xl">🛒</span>
                <span className="text-lg">{cart.length}</span>
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 text-slate-700 font-bold border-2 border-slate-300 rounded-lg hover:bg-slate-100 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-full font-black whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                    : "bg-white border-2 border-slate-300 text-slate-700 hover:border-amber-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-3xl overflow-hidden border-2 border-slate-200 hover:border-amber-400 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-3xl font-black text-amber-600 mb-6">
                    NPR. {item.price.toFixed(2)}
                  </p>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Cart Stage
  if (stage === "cart") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-20 bg-white border-b-2 border-slate-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-black text-slate-900">Your Cart</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setStage("menu")}
                className="px-6 py-3 text-slate-700 font-black border-2 border-slate-300 rounded-xl hover:bg-slate-100 transition-all"
              >
                Continue Shopping
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 text-slate-700 font-black border-2 border-slate-300 rounded-xl hover:bg-slate-100 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="max-w-7xl mx-auto px-6 py-20 flex items-center justify-center min-h-96">
            <div className="text-center">
              <p className="text-8xl mb-6">🛒</p>
              <p className="text-2xl font-black text-slate-900 mb-3">
                Your cart is empty
              </p>
              <button
                onClick={() => setStage("menu")}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black px-8 py-4 rounded-xl hover:shadow-lg transition-all"
              >
                Browse Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-amber-400 transition-all flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-6">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-slate-600 font-semibold">
                        NPR. {item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-10 h-10 bg-white rounded-lg font-black text-slate-900 hover:bg-slate-200 transition-all text-lg"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-black text-lg text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-10 h-10 bg-white rounded-lg font-black text-slate-900 hover:bg-slate-200 transition-all text-lg"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xl font-black text-amber-600 w-28 text-right">
                      NPR. {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 h-fit space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-slate-200 p-8 shadow-lg">
                <h3 className="text-2xl font-black text-slate-900 mb-8">
                  Order Summary
                </h3>

                <div className="space-y-4 mb-8 pb-8 border-b-2 border-slate-300">
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Subtotal</span>
                    <span>NPR. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Tax (10%)</span>
                    <span>NPR. {tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between mb-8">
                  <span className="text-xl font-black text-slate-900">
                    Total
                  </span>
                  <span className="text-3xl font-black text-amber-600">
                    NPR. {total.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => setStage("menu")}
                  className="w-full bg-white border-2 border-slate-300 text-slate-900 font-black py-4 rounded-xl text-base shadow-md hover:bg-slate-50 transition-all mb-3"
                >
                  Order More
                </button>

                <button
                  onClick={submitOrder}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-all"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Checkout Stage
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Order Confirmed
            </h1>
            <p className="text-sm text-slate-500 mt-1">Table {tableNumber}</p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2.5 text-slate-700 font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Order More Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  +
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Add More Items
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Continue ordering to the same bill
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStage("menu")}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-lg mb-6"
              >
                + Order More Items
              </button>

              <p className="text-center text-slate-600 text-sm">
                Your current items will be saved to this bill
              </p>
            </div>

            {/* Bill Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  📋
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Your Bill
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Complete order summary
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6">
                <h3 className="font-black text-lg text-slate-900 mb-6">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center pb-3 border-b border-slate-200 last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-black text-lg text-amber-600">
                        NPR. {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Subtotal</span>
                    <span className="font-semibold">
                      NPR. {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Tax (10%)</span>
                    <span className="font-semibold">NPR. {tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-black text-slate-900">
                    Total Amount
                  </span>
                  <span className="text-4xl font-black text-amber-600">
                    NPR. {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
              <h4 className="font-black text-slate-900 mb-4 text-center">
                Scan to Pay
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl flex justify-center mb-4">
                <img
                  src={paymentQRCode || "/placeholder.svg"}
                  alt="Payment QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
              <p className="text-center text-slate-600 text-sm font-semibold">
                Scan QR with your phone to pay NPR. {total.toFixed(2)}
              </p>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmittingOrder}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              {isSubmittingOrder ? "Placing Order..." : "Payment Completed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Order Placed Stage
  if (stage === "order-placed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-green-200 p-12 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-5xl">✅</span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-black text-slate-900 mb-3">
              Order Confirmed!
            </h1>

            {/* Message */}
            <p className="text-lg text-slate-600 mb-8">
              Your order has been successfully placed. Your order is now being
              prepared!
            </p>

            {/* Order Details */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-8">
              <div className="text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">
                    Table Number:
                  </span>
                  <span className="text-slate-900 font-black">
                    {tableNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">
                    Total Items:
                  </span>
                  <span className="text-slate-900 font-black">
                    {cart.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">
                    Total Amount:
                  </span>
                  <span className="text-slate-900 font-black text-lg">
                    NPR. {total.toFixed(2)}
                  </span>
                </div>
                {placedOrderId && (
                  <div className="flex justify-between pt-3 border-t border-slate-200">
                    <span className="text-slate-600 font-semibold">
                      Order ID:
                    </span>
                    <span className="text-slate-900 font-mono text-xs">
                      {placedOrderId.slice(-8)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Progress Tracking */}
            <div className="bg-white rounded-xl p-6 mb-8 border-2 border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">
                Live Order Progress
              </h3>
              <OrderProgressBar
                progress={orderProgress}
                status={orderStatus as "pending" | "preparing" | "ready"}
                showPercentage={true}
                showStatus={true}
                size="md"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <a
                href={`/order-tracking?table=${tableNumber}${sessionId ? `&session=${sessionId}` : ""}`}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-center"
              >
                Track Your Order Live 📍
              </a>
              <button
                onClick={() => {
                  setStage("menu");
                  setCart([]);
                  setPlacedOrderId(null);
                }}
                className="w-full bg-white border-2 border-slate-300 text-slate-900 font-black py-4 px-6 rounded-xl transition-all hover:bg-slate-50"
              >
                Continue Ordering
              </button>
              <button
                onClick={onBack}
                className="w-full text-slate-600 font-bold py-3 px-6 hover:text-slate-900 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
