"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface Table {
  _id: string;
  tableNumber: number;
  status: "available" | "occupied" | "reserved";
  qrCodeUrl?: string;
}

interface CreateTableForm {
  tableNumber: number;
}

/* ================= API ================= */
const fetchTables = async (): Promise<Table[]> => {
  const res = await fetch("http://localhost:5000/api/tables/");
  if (!res.ok) throw new Error("Failed to fetch tables");
  return res.json();
};

const createTableAPI = async (tableNumber: number) => {
  const res = await fetch("http://localhost:5000/api/tables/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableNumber }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed");
  }
};

const deleteTableAPI = async (tableNumber: number) => {
  const res = await fetch(`http://localhost:5000/api/tables/${tableNumber}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete");
};

const freeTableAPI = async (tableNumber: number) => {
  const res = await fetch(
    `http://localhost:5000/api/tables/free/${tableNumber}`,
    {
      method: "POST",
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to free table");
  }
  return res.json();
};

/* ================= COMPONENT ================= */
export default function TablePage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFreeConfirm, setShowFreeConfirm] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
  });

  const { register, handleSubmit, reset } = useForm<CreateTableForm>();

  const createMutation = useMutation({
    mutationFn: (data: CreateTableForm) => createTableAPI(data.tableNumber),
    onSuccess: () => {
      toast.success("Table created successfully");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTableAPI,
    onSuccess: () => {
      toast.success("Table deleted permanently");
      setSelectedTable(null);
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const freeMutation = useMutation({
    mutationFn: freeTableAPI,
    onSuccess: () => {
      toast.success("Table freed successfully!");
      setSelectedTable(null);
      setShowFreeConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadQR = async () => {
    if (!selectedTable?.qrCodeUrl) return;
    try {
      const res = await fetch(selectedTable.qrCodeUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `table-${selectedTable.tableNumber}-qr.png`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("QR downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const printQR = () => {
    if (!selectedTable?.qrCodeUrl) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html><body style="text-align:center;margin:0;padding:20px;">
          <img src="${selectedTable.qrCodeUrl}" style="max-width:100%;"/>
          <h2>Table ${selectedTable.tableNumber}</h2>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-2xl font-black py-20">Loading tables...</p>
    );

  return (
    <>
      {/* Create Table Form */}
      <form
        onSubmit={handleSubmit((data) => createMutation.mutate(data))}
        className="bg-white rounded-2xl shadow-lg p-8 mb-10"
      >
        <h2 className="text-2xl font-black mb-6">Create New Table</h2>
        <div className="flex gap-4 max-w-md">
          <input
            type="number"
            min="1"
            {...register("tableNumber", { required: true })}
            placeholder="Enter table number"
            className="flex-1 px-5 py-3 border-2 border-slate-300 rounded-xl focus:border-amber-500 font-semibold"
            required
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black px-8 py-3 rounded-xl shadow-lg disabled:opacity-70"
          >
            {createMutation.isPending ? "Creating..." : "Create Table"}
          </button>
        </div>
      </form>

      {/* Table Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {tables.map((table) => {
          const isClickable = table.qrCodeUrl;
          const statusColor =
            table.status === "available"
              ? "border-green-500 bg-green-50"
              : table.status === "occupied"
              ? "border-red-500 bg-red-50"
              : "border-blue-500 bg-blue-50";

          return (
            <div
              key={table._id}
              onClick={() => isClickable && setSelectedTable(table)}
              className={`relative border-4 ${statusColor} rounded-2xl p-8 text-center transition-all shadow-lg
                ${
                  isClickable
                    ? "cursor-pointer hover:scale-105 hover:shadow-2xl"
                    : "opacity-60"
                }
              `}
            >
              <div className="text-5xl font-black mb-2">
                {table.tableNumber}
              </div>
              <p className="text-lg font-bold capitalize">{table.status}</p>

              {/* Free Table Badge (Only for occupied) */}
              {table.status === "occupied" && (
                <div className="absolute -top-3 -right-3 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black shadow">
                  PAYMENT ISSUE?
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-black text-center mb-6">
              Table {selectedTable.tableNumber}
            </h3>

            <div className="bg-gray-100 rounded-2xl p-8 mb-6 flex justify-center">
              <img
                ref={qrRef}
                src={selectedTable.qrCodeUrl}
                alt="QR Code"
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={downloadQR}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition"
              >
                Download QR
              </button>
              <button
                onClick={printQR}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition"
              >
                Print QR
              </button>
            </div>

            {/* Free Table Button - Only if occupied */}
            {selectedTable.status === "occupied" && (
              <button
                onClick={() => setShowFreeConfirm(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl mb-4 transition shadow-lg"
              >
                🔓 Free Table (Manual Override)
              </button>
            )}

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl mb-4 transition"
            >
              🗑️ Delete Table Permanently
            </button>

            <button
              onClick={() => setSelectedTable(null)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Free Table Confirmation */}
      {showFreeConfirm && selectedTable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <h3 className="text-2xl font-black text-orange-600 mb-4">
              Free Table {selectedTable.tableNumber}?
            </h3>
            <p className="text-slate-700 mb-8">
              This will mark the table as available and clear any pending
              session.
              <br />
              <strong>Use only if payment failed or stuck.</strong>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => freeMutation.mutate(selectedTable.tableNumber)}
                disabled={freeMutation.isPending}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg disabled:opacity-70"
              >
                {freeMutation.isPending ? "Freeing..." : "Yes, Free Table"}
              </button>
              <button
                onClick={() => setShowFreeConfirm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedTable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <h3 className="text-2xl font-black text-red-600 mb-4">
              Delete Table {selectedTable.tableNumber}?
            </h3>
            <p className="text-slate-700 mb-8">
              This will <strong>permanently delete</strong> the table and its QR
              code.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => deleteMutation.mutate(selectedTable.tableNumber)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
