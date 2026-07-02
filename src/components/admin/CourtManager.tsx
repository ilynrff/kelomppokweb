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
  venueId: string;
  name: string;
  type: string | null;
  location: string;
  pricePerHour: number;
  images: CourtImage[];
  description?: string | null;
  isActive: boolean;
};

type Venue = {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string | null;
  thumbnail: string | null;
  courts: Court[];
};

type ModalState = 
  | { type: "addVenue" }
  | { type: "editVenue"; venue: Venue }
  | { type: "addCourt"; venueId: string }
  | { type: "editCourt"; court: Court };

export function CourtManager() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Form states
  const [formData, setFormData] = useState<any>({});

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<Venue[]>("/api/venues");
      setVenues(data || []);
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAddVenue = () => {
    setFormData({ name: "", location: "", description: "", thumbnail: "" });
    setSelectedFiles([]);
    setModal({ type: "addVenue" });
  };

  const openEditVenue = (v: Venue) => {
    setFormData({ ...v });
    setSelectedFiles([]);
    setModal({ type: "editVenue", venue: v });
  };

  const openAddCourt = (venueId: string) => {
    setFormData({ name: "", type: "", location: "", pricePerHour: 0, isActive: true, images: [], description: "" });
    setSelectedFiles([]);
    setModal({ type: "addCourt", venueId });
  };

  const openEditCourt = (c: Court) => {
    setFormData({
      ...c,
      images: JSON.parse(JSON.stringify(c.images || [])),
    });
    setSelectedFiles([]);
    setModal({ type: "editCourt", court: c });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setIsSaving(true);
    try {
      // Handle file uploads (images for court, thumbnail for venue)
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("Gagal upload gambar");
          const data = await res.json();
          return data.url;
        });
        uploadedUrls = await Promise.all(uploadPromises);
      }

      if (modal.type === "addVenue" || modal.type === "editVenue") {
        const payload = {
          name: formData.name,
          location: formData.location,
          description: formData.description,
          thumbnail: uploadedUrls.length > 0 ? uploadedUrls[0] : formData.thumbnail,
        };
        const method = modal.type === "addVenue" ? "POST" : "PATCH";
        const url = modal.type === "addVenue" ? "/api/venues" : `/api/venues/${(modal as any).venue.id}`;
        
        await fetchJson(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setToast({ msg: `Venue ${modal.type === "addVenue" ? "ditambahkan" : "disimpan"}.`, type: "success" });
      } 
      else if (modal.type === "addCourt" || modal.type === "editCourt") {
        let finalImages = formData.images || [];
        const newImgs = uploadedUrls.map(url => ({ url, isDefault: false, isActive: true }));
        finalImages = [...finalImages, ...newImgs];

        const payload = {
          name: formData.name,
          type: formData.type,
          location: formData.location,
          pricePerHour: Number(formData.pricePerHour),
          isActive: formData.isActive,
          images: finalImages,
          description: formData.description,
          venueId: modal.type === "addCourt" ? modal.venueId : (modal as any).court.venueId,
        };

        const method = modal.type === "addCourt" ? "POST" : "PATCH";
        const url = modal.type === "addCourt" ? "/api/courts" : `/api/courts/${(modal as any).court.id}`;

        await fetchJson(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setToast({ msg: `Court ${modal.type === "addCourt" ? "ditambahkan" : "disimpan"}.`, type: "success" });
      }

      setModal(null);
      await refresh();
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVenue = async (id: string) => {
    if (!confirm("PERINGATAN: Menghapus Venue akan menghapus semua lapangan di dalamnya! Lanjutkan?")) return;
    try {
      await fetchJson(`/api/venues/${id}`, { method: "DELETE" });
      setToast({ msg: "Venue terhapus.", type: "success" });
      await refresh();
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    }
  };

  const handleDeleteCourt = async (id: string) => {
    if (!confirm("Yakin ingin menghapus lapangan ini?")) return;
    try {
      await fetchJson(`/api/courts/${id}`, { method: "DELETE" });
      setToast({ msg: "Court terhapus.", type: "success" });
      await refresh();
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    }
  };

  return (
    <div className="space-y-8">
      {toast && (
        <Toast isOpen={true} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">Venue & Court Management</h2>
          <p className="text-sm text-white/50 font-medium">Kelola ekosistem multi-lapangan PadelGO</p>
        </div>
        <Button onClick={openAddVenue} className="bg-neon text-black hover:bg-[#c4eb28] font-black uppercase tracking-widest text-[10px] px-6 py-4 shadow-[0_0_20px_rgba(215,255,63,0.3)] transition-all">
          + Tambah Venue
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 border-dashed p-12 text-center">
          <p className="text-white/40 font-bold text-lg">📭 Belum ada venue</p>
          <p className="text-white/30 text-sm mt-2 font-medium">Tambahkan venue baru untuk membuat lapangan.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {venues.map((venue) => (
            <div key={venue.id} className="space-y-6">
              {/* Venue Header Header */}
              <div className="flex flex-col md:flex-row gap-6 bg-[#141414]/80 p-6 rounded-[1.5rem] border border-white/5 items-start md:items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => openEditVenue(venue)} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors">Edit</button>
                  <button onClick={() => handleDeleteVenue(venue.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors">Hapus</button>
                </div>

                {venue.thumbnail ? (
                  <img src={venue.thumbnail} alt={venue.name} className="w-24 h-24 object-cover rounded-[1rem] border border-white/10 shrink-0" />
                ) : (
                  <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[1rem] flex items-center justify-center shrink-0">
                    <span className="text-2xl">🏟️</span>
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-white tracking-tight">{venue.name}</h3>
                  <p className="text-white/50 text-sm mt-1">{venue.location}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded text-white/60">
                      {venue.courts.length} Courts
                    </span>
                    <button onClick={() => openAddCourt(venue.id)} className="text-[10px] font-black uppercase tracking-widest text-neon hover:text-white transition-colors flex items-center gap-1">
                      <span>+</span> Tambah Court
                    </button>
                  </div>
                </div>
              </div>

              {/* Courts Grid for this venue */}
              {venue.courts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-0 md:pl-8">
                  {venue.courts.map(court => (
                    <div key={court.id} className={`p-5 rounded-[1.25rem] border transition-all duration-300 relative group
                      ${court.isActive ? "bg-[#0F0F0F]/80 border-white/5 hover:border-white/20" : "bg-black/50 border-white/5 opacity-75 hover:opacity-100"}
                    `}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <h4 className="font-black text-white text-lg tracking-tight flex items-center gap-2">
                            {court.name}
                            {!court.isActive && <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Inactive</span>}
                          </h4>
                          {court.type && <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{court.type}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-4 mb-5">
                        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                          Rp {court.pricePerHour.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditCourt(court)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteCourt(court.id)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-lg transition-colors">
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <form
            onSubmit={handleSave}
            className="bg-[#0F0F0F] rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
          >
            <div className="p-8 pb-6 border-b border-white/5 shrink-0 bg-[#1A1A1A] rounded-t-[2.5rem]">
              <h3 className="font-black text-2xl text-white tracking-tight">
                {modal.type === "addVenue" ? "Tambah Venue" : 
                 modal.type === "editVenue" ? "Edit Venue" :
                 modal.type === "addCourt" ? "Tambah Court" : "Edit Court"}
              </h3>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* VENUE FIELDS */}
              {(modal.type === "addVenue" || modal.type === "editVenue") && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Nama Venue</label>
                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon" value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Lokasi Lengkap</label>
                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon" value={formData.location || ""} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Deskripsi (Opsional)</label>
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon resize-none" rows={3} value={formData.description || ""} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Thumbnail Venue</label>
                    {formData.thumbnail && (
                      <div className="mb-3 relative w-32 h-32">
                        <img src={formData.thumbnail} className="w-full h-full object-cover rounded-xl border border-white/10" />
                        <button type="button" onClick={() => setFormData({...formData, thumbnail: ""})} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold">X</button>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="w-full text-sm text-white/60 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-white/5 file:text-white cursor-pointer" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
                  </div>
                </>
              )}

              {/* COURT FIELDS */}
              {(modal.type === "addCourt" || modal.type === "editCourt") && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Nama Court</label>
                    <input required type="text" placeholder="e.g. Court 1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon" value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Tipe / Karakteristik</label>
                    <input type="text" placeholder="e.g. Indoor Panoramic" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon" value={formData.type || ""} onChange={(e) => setFormData({...formData, type: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Harga Per Jam (Rp)</label>
                    <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon" value={formData.pricePerHour || ""} onChange={(e) => setFormData({...formData, pricePerHour: Number(e.target.value)})} />
                  </div>
                  <label className="flex items-center gap-3 bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5 mt-2">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-neon rounded-md" />
                    <span className="text-sm font-bold text-white">Court Aktif (Siap Dibooking)</span>
                  </label>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 mt-4">Foto Court (Tampilan Lapangan)</label>
                    <input type="file" multiple accept="image/*" className="w-full text-sm text-white/60 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-white/5 file:text-white cursor-pointer" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 p-8 border-t border-white/5 shrink-0 bg-[#1A1A1A] rounded-b-[2.5rem]">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50" disabled={isSaving}>Batal</button>
              <button type="submit" className="flex-1 py-3.5 bg-neon hover:bg-[#c4eb28] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50" disabled={isSaving}>{isSaving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
