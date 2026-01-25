// "use client";

// import { useState } from "react";

// interface MenuItem {
//   id: number;
//   name: string;
//   category: string;
//   price: number;
//   image: string;
// }

// interface Table {
//   id: number;
//   tableNumber: number;
//   status: "available" | "occupied" | "reserved";
// }

// export default function AdminPanel({ onBack }: { onBack: () => void }) {
//   const [activeTab, setActiveTab] = useState<
//     "overview" | "menu" | "tables" | "settings"
//   >("overview");
//   const [menuItems, setMenuItems] = useState<MenuItem[]>([
//     {
//       id: 1,
//       name: "Margherita Pizza",
//       category: "Main",
//       price: 12.99,
//       image: "/delicious-pizza.png",
//     },
//     {
//       id: 2,
//       name: "Caesar Salad",
//       category: "Appetizer",
//       price: 8.99,
//       image: "/vibrant-mixed-salad.png",
//     },
//     {
//       id: 3,
//       name: "Grilled Salmon",
//       category: "Main",
//       price: 18.99,
//       image: "/fresh-salmon-fillet.png",
//     },
//     {
//       id: 4,
//       name: "Beef Burger",
//       category: "Main",
//       price: 14.99,
//       image: "/classic-beef-burger.png",
//     },
//     {
//       id: 5,
//       name: "Chocolate Cake",
//       category: "Dessert",
//       price: 6.99,
//       image: "/colorful-layered-cake.png",
//     },
//     {
//       id: 6,
//       name: "Cappuccino",
//       category: "Beverage",
//       price: 4.99,
//       image: "/steaming-coffee-cup.png",
//     },
//   ]);

//   const [tables, setTables] = useState<Table[]>([
//     { id: 1, tableNumber: 1, status: "available" },
//     { id: 2, tableNumber: 2, status: "occupied" },
//     { id: 3, tableNumber: 3, status: "available" },
//     { id: 4, tableNumber: 4, status: "reserved" },
//     { id: 5, tableNumber: 5, status: "occupied" },
//   ]);

//   const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
//   const [newItem, setNewItem] = useState({
//     name: "",
//     category: "Main",
//     price: "",
//     image: "/diverse-food-spread.png",
//   });
//   const [newTableCount, setNewTableCount] = useState("");

//   const addMenuItem = () => {
//     if (newItem.name && newItem.price) {
//       setMenuItems([
//         ...menuItems,
//         {
//           id: Math.max(...menuItems.map((m) => m.id), 0) + 1,
//           name: newItem.name,
//           category: newItem.category,
//           price: Number.parseFloat(newItem.price),
//           image: newItem.image,
//         },
//       ]);
//       setNewItem({
//         name: "",
//         category: "Main",
//         price: "",
//         image: "/diverse-food-spread.png",
//       });
//     }
//   };

//   const saveEditedItem = () => {
//     if (editingItem && editingItem.name && editingItem.price) {
//       setMenuItems(
//         menuItems.map((item) =>
//           item.id === editingItem.id ? editingItem : item
//         )
//       );
//       setEditingItem(null);
//     }
//   };

//   const deleteMenuItem = (id: number) => {
//     setMenuItems(menuItems.filter((item) => item.id !== id));
//     if (editingItem?.id === id) setEditingItem(null);
//   };

//   const createTables = () => {
//     const count = Number.parseInt(newTableCount);
//     if (count > 0) {
//       const maxTableNum = Math.max(...tables.map((t) => t.tableNumber), 0);
//       const newTables = Array.from({ length: count }, (_, i) => ({
//         id: Math.max(...tables.map((t) => t.id), 0) + i + 1,
//         tableNumber: maxTableNum + i + 1,
//         status: "available" as const,
//       }));
//       setTables([...tables, ...newTables]);
//       setNewTableCount("");
//     }
//   };

//   const deleteTable = (id: number) => {
//     setTables(tables.filter((table) => table.id !== id));
//   };

//   const stats = {
//     totalTables: tables.length,
//     menuItems: menuItems.length,
//     availableTables: tables.filter((t) => t.status === "available").length,
//     occupiedTables: tables.filter((t) => t.status === "occupied").length,
//   };

//   return (
//     <div className="min-h-screen bg-slate-50">
//       {/* Header */}
//       <div className="sticky top-0 z-20 bg-white border-b-4 border-amber-500 shadow-lg">
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <div className="flex justify-between items-center mb-8">
//             <div className="flex items-center gap-4">
//               <div className="text-5xl">⚙️</div>
//               <div>
//                 <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
//                   Management System
//                 </p>
//                 <h1 className="text-4xl font-black text-slate-900">
//                   Admin Panel
//                 </h1>
//               </div>
//             </div>
//             <button
//               onClick={onBack}
//               className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg"
//             >
//               ← Back
//             </button>
//           </div>

//           {/* Tab Navigation */}
//           <div className="flex gap-3 border-b-2 border-slate-200 overflow-x-auto">
//             {[
//               { id: "overview", label: "📊 Overview" },
//               { id: "menu", label: "🍽️ Menu Items" },
//               { id: "tables", label: "🪑 Tables" },
//               { id: "settings", label: "⚙️ Settings" },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id as any)}
//                 className={`px-6 py-4 font-black transition-all border-b-4 whitespace-nowrap ${
//                   activeTab === tab.id
//                     ? "border-amber-500 text-amber-600 bg-amber-50"
//                     : "border-transparent text-slate-600 hover:text-slate-900"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div className="max-w-7xl mx-auto px-6 py-12">
//         {activeTab === "overview" && (
//           <div className="space-y-8">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//               <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 shadow-lg text-white">
//                 <p className="text-sm font-black uppercase tracking-wide mb-2">
//                   Total Tables
//                 </p>
//                 <p className="text-5xl font-black">{stats.totalTables}</p>
//               </div>
//               <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 shadow-lg text-white">
//                 <p className="text-sm font-black uppercase tracking-wide mb-2">
//                   Available
//                 </p>
//                 <p className="text-5xl font-black">{stats.availableTables}</p>
//               </div>
//               <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 shadow-lg text-white">
//                 <p className="text-sm font-black uppercase tracking-wide mb-2">
//                   Occupied
//                 </p>
//                 <p className="text-5xl font-black">{stats.occupiedTables}</p>
//               </div>
//               <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 shadow-lg text-white">
//                 <p className="text-sm font-black uppercase tracking-wide mb-2">
//                   Menu Items
//                 </p>
//                 <p className="text-5xl font-black">{stats.menuItems}</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Menu Tab */}
//         {activeTab === "menu" && (
//           <div className="space-y-8">
//             {!editingItem ? (
//               <>
//                 {/* Add New Item */}
//                 <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
//                   <h2 className="text-2xl font-black text-slate-900 mb-6">
//                     Add New Menu Item
//                   </h2>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                     <div>
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Item Name
//                       </label>
//                       <input
//                         type="text"
//                         value={newItem.name}
//                         onChange={(e) =>
//                           setNewItem({ ...newItem, name: e.target.value })
//                         }
//                         placeholder="e.g., Margherita Pizza"
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Price ($)
//                       </label>
//                       <input
//                         type="number"
//                         value={newItem.price}
//                         onChange={(e) =>
//                           setNewItem({ ...newItem, price: e.target.value })
//                         }
//                         placeholder="0.00"
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Category
//                       </label>
//                       <select
//                         value={newItem.category}
//                         onChange={(e) =>
//                           setNewItem({ ...newItem, category: e.target.value })
//                         }
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                       >
//                         <option>Main</option>
//                         <option>Appetizer</option>
//                         <option>Dessert</option>
//                         <option>Beverage</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Image URL
//                       </label>
//                       <input
//                         type="text"
//                         value={newItem.image}
//                         onChange={(e) =>
//                           setNewItem({ ...newItem, image: e.target.value })
//                         }
//                         placeholder="Image URL"
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                       />
//                     </div>
//                   </div>
//                   <button
//                     onClick={addMenuItem}
//                     className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-xl transition-all shadow-lg text-lg"
//                   >
//                     + Add Menu Item
//                   </button>
//                 </div>

//                 {/* Current Menu */}
//                 <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
//                   <h2 className="text-2xl font-black text-slate-900 mb-6">
//                     Current Menu ({menuItems.length})
//                   </h2>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {menuItems.map((item) => (
//                       <div
//                         key={item.id}
//                         onClick={() => setEditingItem(item)}
//                         className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-400 overflow-hidden cursor-pointer transition-all hover:shadow-lg"
//                       >
//                         {/* Food Image */}
//                         <div className="relative w-full h-32 bg-slate-100">
//                           <img
//                             src={item.image || "/placeholder.svg"}
//                             alt={item.name}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>

//                         {/* Food Info */}
//                         <div className="p-4">
//                           <h3 className="text-lg font-black text-slate-900 mb-1">
//                             {item.name}
//                           </h3>
//                           <p className="text-xs text-slate-600 font-bold mb-2">
//                             {item.category}
//                           </p>
//                           <p className="text-2xl font-black text-amber-600">
//                             ${item.price.toFixed(2)}
//                           </p>
//                           <p className="text-xs text-slate-500 mt-2">
//                             Click to edit or delete
//                           </p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
//                   <div className="flex justify-between items-center mb-6">
//                     <h2 className="text-2xl font-black text-slate-900">
//                       Edit Menu Item
//                     </h2>
//                     <button
//                       onClick={() => setEditingItem(null)}
//                       className="text-2xl text-slate-400 hover:text-slate-900"
//                     >
//                       ✕
//                     </button>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                     {/* Image preview */}
//                     <div className="md:row-span-3">
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Item Image
//                       </label>
//                       <div className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 mb-4">
//                         <img
//                           src={editingItem.image || "/placeholder.svg"}
//                           alt={editingItem.name}
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                       <input
//                         type="text"
//                         value={editingItem.image}
//                         onChange={(e) =>
//                           setEditingItem({
//                             ...editingItem,
//                             image: e.target.value,
//                           })
//                         }
//                         placeholder="Image URL"
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold text-sm"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Item Name
//                       </label>
//                       <input
//                         type="text"
//                         value={editingItem.name}
//                         onChange={(e) =>
//                           setEditingItem({
//                             ...editingItem,
//                             name: e.target.value,
//                           })
//                         }
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Price ($)
//                       </label>
//                       <input
//                         type="number"
//                         value={editingItem.price}
//                         onChange={(e) =>
//                           setEditingItem({
//                             ...editingItem,
//                             price: Number.parseFloat(e.target.value) || 0,
//                           })
//                         }
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-black text-slate-700 mb-3">
//                         Category
//                       </label>
//                       <select
//                         value={editingItem.category}
//                         onChange={(e) =>
//                           setEditingItem({
//                             ...editingItem,
//                             category: e.target.value,
//                           })
//                         }
//                         className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                       >
//                         <option>Main</option>
//                         <option>Appetizer</option>
//                         <option>Dessert</option>
//                         <option>Beverage</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div className="flex gap-3">
//                     <button
//                       onClick={saveEditedItem}
//                       className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-3 rounded-xl transition-all"
//                     >
//                       ✅ Save Changes
//                     </button>
//                     <button
//                       onClick={() => {
//                         deleteMenuItem(editingItem.id);
//                       }}
//                       className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black py-3 rounded-xl transition-all"
//                     >
//                       🗑️ Delete Item
//                     </button>
//                     <button
//                       onClick={() => setEditingItem(null)}
//                       className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-black py-3 rounded-xl transition-all"
//                     >
//                       ✕ Cancel
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         )}

//         {/* Tables Tab */}
//         {activeTab === "tables" && (
//           <div className="space-y-8">
//             {/* Create Tables */}
//             <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
//               <h2 className="text-2xl font-black text-slate-900 mb-6">
//                 Create New Tables
//               </h2>
//               <div className="flex gap-4">
//                 <div className="flex-1">
//                   <label className="block text-sm font-black text-slate-700 mb-3">
//                     Number of Tables
//                   </label>
//                   <input
//                     type="number"
//                     value={newTableCount}
//                     onChange={(e) => setNewTableCount(e.target.value)}
//                     placeholder="Enter number"
//                     min="1"
//                     className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                   />
//                 </div>
//                 <button
//                   onClick={createTables}
//                   className="self-end bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg"
//                 >
//                   Create
//                 </button>
//               </div>
//             </div>

//             {/* Tables List */}
//             <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
//               <h2 className="text-2xl font-black text-slate-900 mb-6">
//                 All Tables ({tables.length})
//               </h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 {tables.map((table) => {
//                   const statusStyles =
//                     table.status === "available"
//                       ? "from-green-100 to-green-50 border-green-300"
//                       : table.status === "occupied"
//                       ? "from-orange-100 to-orange-50 border-orange-300"
//                       : "from-blue-100 to-blue-50 border-blue-300";

//                   const statusIcon =
//                     table.status === "available"
//                       ? "🟢"
//                       : table.status === "occupied"
//                       ? "🟠"
//                       : "🔵";

//                   return (
//                     <div
//                       key={table.id}
//                       className={`bg-gradient-to-br ${statusStyles} rounded-2xl border-2 p-6 hover:shadow-lg transition-all`}
//                     >
//                       <div className="flex items-center justify-between mb-4">
//                         <h3 className="text-4xl font-black text-slate-900">
//                           Table {table.tableNumber}
//                         </h3>
//                         <span className="text-3xl">{statusIcon}</span>
//                       </div>
//                       <p className="text-sm font-black text-slate-700 mb-4 capitalize">
//                         {table.status}
//                       </p>
//                       <button
//                         onClick={() => deleteTable(table.id)}
//                         className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-black rounded-lg transition-all text-sm"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Settings Tab */}
//         {activeTab === "settings" && (
//           <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
//             <h2 className="text-2xl font-black text-slate-900 mb-8">
//               Restaurant Settings
//             </h2>
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-black text-slate-700 mb-3">
//                   Restaurant Name
//                 </label>
//                 <input
//                   type="text"
//                   defaultValue="The Grand Hotel"
//                   className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-black text-slate-700 mb-3">
//                   Address
//                 </label>
//                 <input
//                   type="text"
//                   defaultValue="123 Main Street, Downtown"
//                   className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                 />
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-black text-slate-700 mb-3">
//                     Tax Rate (%)
//                   </label>
//                   <input
//                     type="number"
//                     defaultValue="10"
//                     className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-black text-slate-700 mb-3">
//                     Service Charge (%)
//                   </label>
//                   <input
//                     type="number"
//                     defaultValue="5"
//                     className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold"
//                   />
//                 </div>
//               </div>
//               <button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-xl transition-all shadow-lg text-lg">
//                 💾 Save Settings
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
