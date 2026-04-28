"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type Court = {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  image?: string | null;
  description?: string | null;
};

type EditingCourt = {
  id?: string;
  name: string;
  location: string;
  pricePerHour: number;
  image?: string;
  description?: string;
};

export function CourtManager() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingCourt, setEditingCourt] = useState<EditingCourt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<Court[]>("/api/courts");
      setCourts(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
      setCourts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAdd = () => {
    setEditingCourt({ name: "", location: "", pricePerHour: 0, image: "" });
    setModalMode("add");
  };

  const openEdit = (court: Court) => {
    setEditingCourt({
      id: court.id,
      name: court.name || "",
      location: court.location || "",
      pricePerHour: court.pricePerHour || 0,
      image: court.image || "",
      description: court.description || "",
    });
    setModalMode("edit");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    setIsSaving(true);
    try {
      const payload = {
        name: editingCourt.name,
        location: editingCourt.location,
        pricePerHour: Number(editingCourt.pricePerHour),
        image: editingCourt.image || null,
        description: editingCourt.description || null,
      };

      if (modalMode === "add") {
        await fetchJson<Court>("/api/courts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson<Court>(`/api/courts/${editingCourt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setToast({ msg: "Court tersimpan.", type: "success" });
      setModalMode(null);
      setEditingCourt(null);
      await refresh();
    } catch (e: unknown) {
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus lapangan ini?")) return;
    try {
      await fetchJson<{ success: boolean }>(`/api/courts/${id}`, {
        method: "DELETE",
      });
      setToast({ msg: "Court terhapus.", type: "success" });
      await refresh();
    } catch (e: unknown) {
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          isOpen={true}
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Pengaturan Lapangan
        </h2>
        <p className="text-sm text-slate-600">Kelola data lapangan padel</p>
      </div>

      {/* Add Button */}
      <Button
        onClick={openAdd}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        + Tambah Lapangan Baru
      </Button>

      {/* Courts List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 animate-pulse">
          ⏳ Loading...
        </div>
      ) : courts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-8 text-center">
          <p className="text-slate-400 font-semibold">📭 Belum ada lapangan</p>
          <p className="text-slate-500 text-sm mt-1">
            Tambahkan lapangan baru untuk memulai
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {courts.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs whitespace-nowrap">
                        Rp {Number(c.pricePerHour || 0).toLocaleString("id-ID")}
                        /jam
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base truncate">
                      {c.name}
                    </h4>
                    <p className="text-slate-600 text-sm flex items-center gap-1 mt-1">
                      <span>📍</span>
                      <span className="truncate">{c.location}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-lg transition-colors duration-200"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm rounded-lg transition-colors duration-200"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalMode && editingCourt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl"
          >
            <h3 className="font-bold text-2xl text-slate-900 mb-6">
              {modalMode === "add" ? "Tambah Lapangan Baru" : "Edit Lapangan"}
            </h3>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Nama Lapangan
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Court A1"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={editingCourt.name}
                  onChange={(e) =>
                    setEditingCourt({ ...editingCourt, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Lokasi
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Basement, Level 2"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={editingCourt.location}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Harga Per Jam (Rp)
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={editingCourt.pricePerHour ?? ""}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      pricePerHour: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Image URL (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={editingCourt.image ?? ""}
                  onChange={(e) =>
                    setEditingCourt({ ...editingCourt, image: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  placeholder="Masukkan deskripsi lapangan padel..."
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={editingCourt.description ?? ""}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors duration-200"
                disabled={isSaving}
                onClick={() => {
                  setModalMode(null);
                  setEditingCourt(null);
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
