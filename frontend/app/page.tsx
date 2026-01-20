// "use client";

// import { useState } from "react";
// import CustomerApp from "../components/demo/customer-app";
// import KitchenDashboard from "../components/demo/kitchen-dashboard";
// import AdminPanel from "../components/demo/admin-panel";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// export default function Home() {
//   const [currentView, setCurrentView] = useState<
//     "home" | "customer" | "kitchen" | "admin"
//   >("home");

//   if (currentView === "customer") {
//     return <CustomerApp onBack={() => setCurrentView("home")} />;
//   }

//   if (currentView === "kitchen") {
//     return <KitchenDashboard onBack={() => setCurrentView("home")} />;
//   }

//   if (currentView === "admin") {
//     return <AdminPanel onBack={() => setCurrentView("home")} />;
//   }
//   const router = useRouter();

//   function continueAsGuest() {
//     // localStorage works only on client, so it's safe here
//     localStorage.setItem("guest", "true");
//     router.push("/menu");
//   }
//   return (
//     <main className="min-h-screen bg-background">
//       {/* Hero Section */}
//       <div className="relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>

//         <div className="relative container mx-auto px-4 py-24 sm:py-32">
//           <div className="text-center max-w-3xl mx-auto">
//             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 border border-secondary mb-6">
//               <span className="text-sm font-medium text-foreground">
//                 Welcome to
//               </span>
//             </div>

//             <div>
//               <header
//                 style={{
//                   display: "flex",
//                   justifyContent: "flex-end",
//                   gap: 8,
//                   padding: 12,
//                 }}
//               >
//                 <button onClick={() => router.push("/login")}>Login</button>
//                 <button onClick={() => router.push("/signup")}>Signup</button>
//               </header>

//               <main style={{ textAlign: "center", marginTop: "4rem" }}>
//                 <h1>Welcome to QuickOrders</h1>
//                 <p>Order quickly from your room or in-house dining</p>
//                 <button onClick={continueAsGuest}>Continue as Guest</button>
//               </main>
//             </div>

//             <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 tracking-tight">
//               QuickOrders
//             </h1>

//             <p className="text-lg md:text-xl text-muted-foreground mb-2">
//               The Modern Hotel Ordering Experience
//             </p>
//             <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
//               Seamlessly scan, order, and pay. Experience dining reimagined for
//               the modern hotel.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Main CTA Cards */}
//       <div className="container mx-auto px-4 py-12">
//         <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
//           {/* Customer App Card */}
//           <Link href="/customer">
//             <div className="group relative rounded-2xl bg-card border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30">
//               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <div className="relative p-8 sm:p-10">
//                 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                   <span className="text-2xl">📱</span>
//                 </div>
//                 <h3 className="text-2xl font-bold text-foreground mb-3">
//                   Customer App
//                 </h3>
//                 <p className="text-muted-foreground mb-8 leading-relaxed">
//                   Scan QR, explore the menu, add items to cart, and place your
//                   order instantly.
//                 </p>
//                 <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
//                   <span>Launch App</span>
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 5l7 7-7 7"
//                     />
//                   </svg>
//                 </div>
//               </div>
//             </div>
//           </Link>

//           {/* Kitchen Dashboard Card */}
//           <Link href="/kitchen">
//             <div className="group relative rounded-2xl bg-card border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-accent/30">
//               <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <div className="relative p-8 sm:p-10">
//                 <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                   <span className="text-2xl">👨‍🍳</span>
//                 </div>
//                 <h3 className="text-2xl font-bold text-foreground mb-3">
//                   Kitchen Dashboard
//                 </h3>
//                 <p className="text-muted-foreground mb-8 leading-relaxed">
//                   Real-time order management with table tracking and status
//                   updates.
//                 </p>
//                 <div className="flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
//                   <span>View Dashboard</span>
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 5l7 7-7 7"
//                     />
//                   </svg>
//                 </div>
//               </div>
//             </div>
//           </Link>

//           {/* Admin Panel Card */}
//           <Link href="/admin">
//             <div className="group relative rounded-2xl bg-card border border-border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30">
//               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <div className="relative p-8 sm:p-10">
//                 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                   <span className="text-2xl">⚙️</span>
//                 </div>
//                 <h3 className="text-2xl font-bold text-foreground mb-3">
//                   Admin Panel
//                 </h3>
//                 <p className="text-muted-foreground mb-8 leading-relaxed">
//                   Manage menu items, tables, staff, and view restaurant
//                   analytics.
//                 </p>
//                 <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
//                   <span>Access Panel</span>
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 5l7 7-7 7"
//                     />
//                   </svg>
//                 </div>
//               </div>
//             </div>
//           </Link>
//         </div>
//       </div>

//       {/* Features Section */}
//       <div className="container mx-auto px-4 py-20">
//         <div className="max-w-4xl mx-auto">
//           <h2 className="text-4xl font-bold text-foreground mb-4 text-center">
//             How It Works
//           </h2>
//           <p className="text-center text-muted-foreground mb-12">
//             The complete dining experience in 5 simple steps
//           </p>

//           <div className="grid md:grid-cols-5 gap-3 mb-12">
//             {[
//               { num: "1", title: "Scan", desc: "QR Code" },
//               { num: "2", title: "Browse", desc: "Menu" },
//               { num: "3", title: "Order", desc: "Items" },
//               { num: "4", title: "Prepare", desc: "Kitchen" },
//               { num: "5", title: "Pay", desc: "Checkout" },
//             ].map((step, idx) => (
//               <div key={idx} className="text-center">
//                 <div className="bg-gradient-to-br from-primary to-accent rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg">
//                   {step.num}
//                 </div>
//                 <h4 className="font-semibold text-foreground text-sm mb-1">
//                   {step.title}
//                 </h4>
//                 <p className="text-xs text-muted-foreground">{step.desc}</p>
//               </div>
//             ))}
//           </div>

//           {/* Feature Grid */}
//           <div className="grid md:grid-cols-2 gap-4">
//             {[
//               {
//                 icon: "⚡",
//                 title: "Real-time Updates",
//                 desc: "Instant order notifications and status tracking",
//               },
//               {
//                 icon: "🔒",
//                 title: "Secure & Reliable",
//                 desc: "Complete order management with data integrity",
//               },
//               {
//                 icon: "📊",
//                 title: "Analytics",
//                 desc: "Track sales, orders, and restaurant performance",
//               },
//               {
//                 icon: "👥",
//                 title: "Multi-User",
//                 desc: "Customers, kitchen staff, and admin roles",
//               },
//               {
//                 icon: "📱",
//                 title: "Mobile Optimized",
//                 desc: "Perfect on phones, tablets, and desktops",
//               },
//               {
//                 icon: "💳",
//                 title: "Digital Billing",
//                 desc: "Easy checkout with invoice generation",
//               },
//             ].map((feature, idx) => (
//               <div
//                 key={idx}
//                 className="rounded-xl border border-border bg-card/50 p-6 hover:bg-card hover:border-primary/20 transition-all duration-300"
//               >
//                 <div className="text-3xl mb-3">{feature.icon}</div>
//                 <h4 className="font-semibold text-foreground mb-2">
//                   {feature.title}
//                 </h4>
//                 <p className="text-sm text-muted-foreground">{feature.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="border-t border-border bg-card/50">
//         <div className="container mx-auto px-4 py-12 text-center text-muted-foreground text-sm">
//           <p>
//             Built with React & Tailwind CSS • Fully functional frontend demo
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// }

// "use client";

// import { useRouter } from "next/navigation";
// import Link from "next/link";

// export default function Home() {
//   const router = useRouter();

//   function continueAsGuest() {
//     localStorage.setItem("guest", "true");
//     router.push("/customer  ");
//   }

//   return (
//     <main className="min-h-screen bg-gray-50 flex flex-col">
//       {/* 🔹 HEADER */}
//       <header className="w-full flex justify-end px-6 py-4 bg-white shadow-sm">
//         <button
//           onClick={() => router.push("/login")}
//           className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200"
//         >
//           Login
//         </button>
//         <button
//           onClick={() => router.push("/signup")}
//           className="ml-3 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           Signup
//         </button>
//       </header>

//       {/* 🔹 HERO SECTION */}
//       <section className="flex-1 flex flex-col justify-center items-center text-center px-4">
//         <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
//           QuickOrders
//         </h1>

//         <p className="text-lg text-gray-600 mb-6 max-w-xl">
//           Scan • Order • Relax — Experience hotel dining reimagined.
//         </p>

//         <button
//           onClick={continueAsGuest}
//           className="px-6 py-3 bg-black text-white rounded-xl text-lg shadow-md hover:bg-gray-800"
//         >
//           Continue as Guest
//         </button>

//         <p className="mt-6 text-sm text-gray-500">No registration required</p>
//       </section>

//       {/* 🔹 THREE FEATURE CARDS */}
//       <section className="py-16 bg-white">
//         <h2 className="text-3xl font-bold text-center mb-10">
//           Explore QuickOrders
//         </h2>

//         <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
//           {/* Card */}
//           <Link href="/customer">
//             <div className="bg-white border shadow-sm rounded-2xl p-7 hover:shadow-xl transition cursor-pointer">
//               <div className="text-4xl mb-4">📱</div>
//               <h3 className="text-xl font-bold mb-2">Customer App</h3>
//               <p className="text-gray-600">
//                 Browse menu, order food, and enjoy seamless digital dining.
//               </p>
//             </div>
//           </Link>

//           <Link href="/kitchen">
//             <div className="bg-white border shadow-sm rounded-2xl p-7 hover:shadow-xl transition cursor-pointer">
//               <div className="text-4xl mb-4">👨‍🍳</div>
//               <h3 className="text-xl font-bold mb-2">Kitchen Dashboard</h3>
//               <p className="text-gray-600">
//                 Track live orders and streamline kitchen operations.
//               </p>
//             </div>
//           </Link>

//           <Link href="/admin">
//             <div className="bg-white border shadow-sm rounded-2xl p-7 hover:shadow-xl transition cursor-pointer">
//               <div className="text-4xl mb-4">⚙️</div>
//               <h3 className="text-xl font-bold mb-2">Admin Panel</h3>
//               <p className="text-gray-600">
//                 Manage menu, tables, staff, and restaurant analytics.
//               </p>
//             </div>
//           </Link>
//         </div>
//       </section>

//       {/* 🔹 FOOTER */}
//       <footer className="py-6 text-center text-gray-500 text-sm">
//         © {new Date().getFullYear()} QuickOrders — Hotel Ordering System
//       </footer>
//     </main>
//   );
// }

"use client";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();

  function continueAsGuest() {
    localStorage.setItem("guest", "true");
    router.push("/customer");
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative text-white flex flex-col"
      style={{
        backgroundImage:
          "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS3qeb7IfMEYFeNbIVzCM18lWtZAP7ZGTGiA&s')",
      }}
    >
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

      {/* CONTENT WRAPPER */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="w-full flex justify-end p-6 gap-4">
          <button
            onClick={() => router.push("/login")}
            className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition shadow-lg"
          >
            Login
          </button>

          {/* <button
            onClick={() => router.push("/signup")}
            className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition shadow-lg"
          >
            Signup
          </button> */}
        </header>

        {/* MAIN */}
        <main className="flex flex-col items-center justify-center flex-1 text-center px-6">
          <h1 className="text-6xl font-extrabold tracking-wide bg-gradient-to-r from-yellow-300 to-yellow-500 text-transparent bg-clip-text drop-shadow-2xl">
            QuickOrders
          </h1>

          <p className="mt-4 text-lg text-gray-200 max-w-md drop-shadow-lg">
            Order meals, drinks & services directly from your hotel room — fast,
            smooth, and premium.
          </p>

          <button
            onClick={continueAsGuest}
            className="mt-10 px-10 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            Continue as Guest
          </button>

          {/* PREMIUM GLASS CARD */}
          <div className="mt-16 p-6 bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl max-w-lg shadow-2xl">
            <p className="text-gray-200 drop-shadow-sm">
              Enjoy seamless ordering with no signup required. Your comfort,
              delivered instantly.
            </p>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="text-center py-6 text-gray-300 text-sm drop-shadow-md">
          © {new Date().getFullYear()} QuickOrders — Premium Hotel Ordering
          System
        </footer>
      </div>
    </div>
  );
}
