"use client";

import { useState, useEffect } from "react";
import { api } from "../../libs/api";
import toast from "react-hot-toast";

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

export default function MenuItemPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "main",
    price: "",
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.get("/menus");
      setMenuItems(response.data);
    } catch (error) {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "main", price: "" });
    setImagePreview("");
    setImageFile(null);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
    });
    setImagePreview(item.image);
    setImageFile(null);
  };

  const closeModal = () => {
    setEditingItem(null);
    setShowAddForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!editingItem && !imageFile) {
      toast.error("Image is required for new items");
      return;
    }

    // Prepare FormData
    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("category", formData.category);
    submitData.append("price", formData.price);

    if (imageFile) {
      submitData.append("image", imageFile);
    } else if (editingItem) {
      // If editing and no new image selected, send existing image URL
      submitData.append("imageUrl", editingItem.image);
    }

    // Debugging logs
    console.log("=== Submitting Menu Item ===");
    console.log("Name:", formData.name);
    console.log("Category:", formData.category);
    console.log("Price:", formData.price);
    console.log("Image File:", imageFile);
    if (!imageFile && editingItem) {
      console.log("Using existing image URL:", editingItem.image);
    }

    try {
      let response;
      if (editingItem) {
        response = await api.put(`/menus/${editingItem._id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMenuItems(
          menuItems.map((item) =>
            item._id === editingItem._id ? response.data.menuItem : item
          )
        );
        toast.success("Menu item updated successfully!");
      } else {
        response = await api.post("/menus/create", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMenuItems([...menuItems, response.data.menuItem]);
        toast.success("Menu item added successfully!");
      }
      closeModal();
      fetchMenuItems(); // refresh the list
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      toast.error(error.response?.data?.message || "Failed to save item");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await api.delete(`/menus/${deleteConfirmId}`);
      setMenuItems(menuItems.filter((item) => item._id !== deleteConfirmId));
      toast.success("Item deleted successfully");
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-2xl font-black">⏳ Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Menu Items</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3 px-6 rounded-xl shadow-lg transition"
        >
          ➕ Add Menu Item
        </button>
      </div>

      {/* Menu Grid */}
      {menuItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl font-black text-slate-600">
            No menu items yet
          </p>
          <p className="text-slate-500 mt-2">Click "Add Menu Item" to start</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition"
            >
              <div className="h-64 bg-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-black text-amber-600 uppercase">
                  {item.category}
                </p>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {item.name}
                </h3>
                <p className="text-3xl font-black text-amber-600 mt-4">
                  NPR {item.price.toFixed(2)}
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddForm || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h3 className="text-2xl font-black text-slate-900 mb-6">
              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name, Category, Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-amber-500"
                    required
                  >
                    <option value="main">Main Course</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverage">Beverage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black mb-2">
                    Price (NPR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-black mb-2">
                  Image {editingItem ? "(optional)" : "*"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-slate-600 mb-2">
                      Preview:
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-64 w-64 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-xl"
                >
                  {editingItem ? "Update Item" : "Create Item"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-black py-4 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
            <h3 className="text-2xl font-black text-red-600 mb-4">
              Confirm Delete
            </h3>
            <p className="text-slate-700 mb-8">
              Are you sure you want to delete this menu item? This action cannot
              be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
