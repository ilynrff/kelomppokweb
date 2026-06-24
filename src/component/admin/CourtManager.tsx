"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type CourtImage = {
  url: string;
  isDefault: boolean;
  isActive: boolean;
};

type Court = {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  images: CourtImage[];
  description?: string | null;
};

type EditingCourt = {
  id?: string;
  name: string;
  location: string;
  pricePerHour: number;
  images: CourtImage[];
  description?: string;
};

export function CourtManager() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingCourt, setEditingCourt] = useState<EditingCourt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<Court[]>("/api/courts");
      // Backward compatibility & mapping
      const mapped = (Array.isArray(data) ? data : []).map((c) => {
        let rawImages = c.images || [];
        // If it's still string array, map it
        const images = rawImages
          .map((img: any) => {
            if (typeof img === "string")
              return { url: img, isDefault: false, isActive: true };
            return {
              url: img.url || "",
              isDefault: !!img.isDefault,
              isActive: img.isActive !== undefined ? !!img.isActive : true,
            };
          })
          .filter((img: any) => !!img.url);

        return { ...c, images };
      });
      setCourts(mapped);
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
    setEditingCourt({ name: "", location: "", pricePerHour: 0, images: [] });
    setSelectedFiles([]);
    setModalMode("add");
  };

  const openEdit = (court: Court) => {
    setEditingCourt({
      id: court.id,
      name: court.name || "",
      location: court.location || "",
      pricePerHour: court.pricePerHour || 0,
      images: JSON.parse(JSON.stringify(court.images || [])), // deep clone
      description: court.description || "",
    });
    setSelectedFiles([]);
    setModalMode("edit");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    setIsSaving(true);
    try {
      let finalImages = [...editingCourt.images];

      // 1. Upload new files if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Gagal upload gambar");
          const data = await res.json();
          return { url: data.url, isDefault: false, isActive: true };
        });
        const uploadedImages = await Promise.all(uploadPromises);
        finalImages = [...finalImages, ...uploadedImages];
      }

      const payload = {
        name: editingCourt.name,
        location: editingCourt.location,
        pricePerHour: Number(editingCourt.pricePerHour),
        images: finalImages.filter((img) => !!img.url),
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
      setSelectedFiles([]);
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
        <h2 className="text-3xl font-black text-white tracking-tight">
          Pengaturan Lapangan
        </h2>
        <p className="text-lg text-white/60 font-medium">Kelola data lapangan padel</p>
      </div>

      {/* Add Button */}
      <Button
        onClick={openAdd}
        className="w-full bg-neon text-black hover:bg-[#c4eb28] font-black uppercase tracking-widest text-sm py-4 shadow-[0_0_20px_rgba(215,255,63,0.3)] transition-all"
      >
        + Tambah Lapangan Baru
      </Button>

      {/* Courts List */}
      {isLoading ? (
        <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-12 animate-pulse flex justify-center">
          <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
        </div>
      ) : courts.length === 0 ? (
        <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 border-dashed p-12 text-center">
          <p className="text-white/40 font-bold text-lg">📭 Belum ada lapangan</p>
          <p className="text-white/30 text-sm mt-2 font-medium">
            Tambahkan lapangan baru untuk memulai
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courts.map((c) => (
            <div
              key={c.id}
              className="bg-[#0F0F0F]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-white/5 shadow-xl hover:shadow-2xl hover:border-white/20 transition-all duration-300 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neon/10 border border-neon/20 text-neon font-black text-xs uppercase tracking-widest whitespace-nowrap">
                        Rp {Number(c.pricePerHour || 0).toLocaleString("id-ID")} /jam
                      </span>
                      <span className="text-[10px] text-white/40 font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                        {c.images.filter((img) => img.isActive).length} Foto Aktif
                      </span>
                    </div>
                    <h4 className="font-black text-white text-xl truncate tracking-tight">
                      {c.name}
                    </h4>
                    <p className="text-white/50 text-sm flex items-center gap-1.5 mt-1.5 font-medium">
                      <span>📍</span>
                      <span className="truncate">{c.location}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-3 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-black text-xs uppercase tracking-widest rounded-xl transition-colors duration-200"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-xs uppercase tracking-widest rounded-xl transition-colors duration-200"
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
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <form
            onSubmit={handleSave}
            className="bg-[#0F0F0F] rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
          >
            <div className="p-8 pb-6 border-b border-white/5 shrink-0 bg-[#1A1A1A] rounded-t-[2.5rem]">
              <h3 className="font-black text-2xl text-white tracking-tight">
                {modalMode === "add" ? "Tambah Lapangan Baru" : "Edit Lapangan"}
              </h3>
              <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-2">
                PadelGo Admin
              </p>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                  Nama Lapangan
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Court A1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon focus:border-transparent transition-all placeholder:text-white/20"
                  value={editingCourt.name}
                  onChange={(e) =>
                    setEditingCourt({ ...editingCourt, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                  Lokasi
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Basement, Level 2"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon focus:border-transparent transition-all placeholder:text-white/20"
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
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                  Harga Per Jam (Rp)
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon focus:border-transparent transition-all placeholder:text-white/20"
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
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                  Gambar Lapangan
                </label>

                {/* Existing Images List */}
                <div className="space-y-3 mb-4">
                  {editingCourt.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${img.isActive ? "bg-white/5 border-white/10" : "bg-black/50 border-white/5 opacity-50"}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={img.url}
                          alt="preview"
                          className="w-10 h-10 object-cover rounded-lg border border-white/10"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-neon">
                            {img.isDefault ? "Default Asset" : "Custom Upload"}
                          </span>
                          <span className="text-xs font-medium text-white/60 truncate max-w-[150px]">
                            {img.url}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {img.isDefault ? (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...editingCourt.images];
                              next[idx].isActive = !next[idx].isActive;
                              setEditingCourt({
                                ...editingCourt,
                                images: next,
                              });
                            }}
                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg ${img.isActive ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}
                          >
                            {img.isActive ? "Disable" : "Enable"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const next = editingCourt.images.filter(
                                (_, i) => i !== idx,
                              );
                              setEditingCourt({
                                ...editingCourt,
                                images: next,
                              });
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`file-${idx}`}
                      className="flex items-center justify-between bg-blue-500/10 p-3 rounded-xl border border-blue-500/20"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-[9px] font-black text-blue-400 border border-blue-500/30">
                          FILE
                        </div>
                        <span className="text-xs font-bold text-blue-300 truncate">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = selectedFiles.filter(
                            (_, i) => i !== idx,
                          );
                          setSelectedFiles(next);
                        }}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 p-1.5 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="w-full text-sm text-white/60 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-white/5 file:text-white hover:file:bg-white/10 cursor-pointer file:uppercase file:tracking-widest"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles([...selectedFiles, ...files]);
                    }}
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Atau masukkan URL gambar..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neon text-white placeholder:text-white/30"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setEditingCourt({
                              ...editingCourt,
                              images: [
                                ...editingCourt.images,
                                { url: val, isDefault: false, isActive: true },
                              ],
                            });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                    *Tekan Enter pada input URL untuk menambahkannya.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  placeholder="Masukkan deskripsi lapangan padel..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon focus:border-transparent transition-all resize-none placeholder:text-white/20"
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

            <div className="flex gap-3 p-8 border-t border-white/5 shrink-0 bg-[#1A1A1A] rounded-b-[2.5rem]">
              <button
                type="button"
                className="flex-1 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors duration-200"
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
                className="flex-1 px-5 py-3.5 bg-neon hover:bg-[#c4eb28] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-200 disabled:opacity-50 shadow-[0_0_15px_rgba(215,255,63,0.3)]"
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
