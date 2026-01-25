"use client";

import React, { useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

const MenuTab = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: 1,
      name: "Margherita Pizza",
      category: "Main",
      price: 12.99,
      image: "/delicious-pizza.png",
    },
    {
      id: 2,
      name: "Caesar Salad",
      category: "Appetizer",
      price: 8.99,
      image: "/vibrant-mixed-salad.png",
    },
    {
      id: 3,
      name: "Grilled Salmon",
      category: "Main",
      price: 18.99,
      image: "/fresh-salmon-fillet.png",
    },
  ]);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Main",
    price: "",
    image: "/diverse-food-spread.png",
  });

  const addMenuItem = () => {
    if (newItem.name && newItem.price) {
      setMenuItems([
        ...menuItems,
        {
          id: Math.max(...menuItems.map((m) => m.id), 0) + 1,
          name: newItem.name,
          category: newItem.category,
          price: Number.parseFloat(newItem.price),
          image: newItem.image,
        },
      ]);
      setNewItem({
        name: "",
        category: "Main",
        price: "",
        image: "/diverse-food-spread.png",
      });
    }
  };

  const saveEditedItem = () => {
    if (editingItem && editingItem.name && editingItem.price) {
      setMenuItems(
        menuItems.map((item) =>
          item.id === editingItem.id ? editingItem : item
        )
      );
      setEditingItem(null);
    }
  };

  const deleteMenuItem = (id: number) => {
    setMenuItems(menuItems.filter((item) => item.id !== id));
    if (editingItem?.id === id) setEditingItem(null);
  };

  return (
    <div className="space-y-8">
      {!editingItem ? (
        <>
          {/* Add New Item */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              Add New Menu Item
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl"
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl"
              />
              <select
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl"
              >
                <option>Main</option>
                <option>Appetizer</option>
                <option>Dessert</option>
                <option>Beverage</option>
              </select>
              <input
                type="text"
                placeholder="Image URL"
                value={newItem.image}
                onChange={(e) =>
                  setNewItem({ ...newItem, image: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl"
              />
            </div>
            <button
              onClick={addMenuItem}
              className="w-full bg-amber-500 text-white py-3 rounded-xl"
            >
              + Add Menu Item
            </button>
          </div>

          {/* Current Menu */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              Current Menu ({menuItems.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setEditingItem(item)}
                  className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-400 cursor-pointer"
                >
                  <div className="relative w-full h-32 bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-black">{item.name}</h3>
                    <p className="text-xs text-slate-600 font-bold">
                      {item.category}
                    </p>
                    <p className="text-2xl font-black text-amber-600">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Edit Menu Item */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              Edit Menu Item
            </h2>
            <input
              type="text"
              value={editingItem.name}
              onChange={(e) =>
                setEditingItem({ ...editingItem, name: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl mb-3"
            />
            <input
              type="number"
              value={editingItem.price}
              onChange={(e) =>
                setEditingItem({
                  ...editingItem,
                  price: Number(e.target.value),
                })
              }
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl mb-3"
            />
            <select
              value={editingItem.category}
              onChange={(e) =>
                setEditingItem({ ...editingItem, category: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl mb-3"
            >
              <option>Main</option>
              <option>Appetizer</option>
              <option>Dessert</option>
              <option>Beverage</option>
            </select>
            <input
              type="text"
              value={editingItem.image}
              onChange={(e) =>
                setEditingItem({ ...editingItem, image: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl mb-3"
            />

            <div className="flex gap-3">
              <button
                onClick={saveEditedItem}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl"
              >
                ✅ Save
              </button>
              <button
                onClick={() => deleteMenuItem(editingItem.id)}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-slate-300 py-3 rounded-xl"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MenuTab;
