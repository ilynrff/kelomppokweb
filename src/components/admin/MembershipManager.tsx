"use client";

import { useState } from "react";
import { 
  Check, X, Eye, Clock, 
  ExternalLink, User, WhatsApp, 
  Search, Filter, Calendar, 
  ChevronRight, ArrowUpRight, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

type MembershipRequest = {
  id: string;
  userId: string;
  proofImage: string;
  status: string;
  amount: number;
  createdAt: string;
  user?: { name?: string; whatsapp?: string };
};

type Props = {
  initialRequests: MembershipRequest[];
};

export function MembershipManager({ initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" as "success" | "error" });
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredRequests = requests.filter(r => {
    if (filterStatus === "ALL") return true;
    return r.status === filterStatus;
  });

  const handleAction = async (id: string, status: "CONFIRMED" | "REJECTED") => {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/admin/membership/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status");

      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setToast({ open: true, message: `Membership ${status === "CONFIRMED" ? "disetujui" : "ditolak"}`, type: "success" });
    } catch (err: any) {
      setToast({ open: true, message: err.message, type: "error" });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <Toast 
        isOpen={toast.open} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, open: false }))} 
      />

      {/* Filters Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING", "CONFIRMED", "REJECTED"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                filterStatus === s 
                  ? "bg-neon text-black shadow-md border border-neon" 
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
          Total: {filteredRequests.length} Requests
        </div>
      </div>

      {/* Requests Table Wrapper */}
      <div className="bg-[#0F0F0F]/40 backdrop-blur-md rounded-[1.5rem] border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">User</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Payment Proof</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white italic uppercase tracking-tight">{request.user?.name}</p>
                        <p className="text-[10px] font-bold text-white/30 mt-0.5">{request.user?.whatsapp}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => setSelectedImage(request.proofImage)}
                      className="group/btn flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neon/5 border border-neon/10 hover:bg-neon/10 transition-all active:scale-95"
                    >
                      <Eye size={12} className="text-neon" />
                      <span className="text-[9px] font-black text-neon uppercase tracking-widest italic">View Proof</span>
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-white/40">
                      <Calendar size={12} />
                      <p className="text-[10px] font-bold uppercase">{new Date(request.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    {request.status === "PENDING" ? (
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(request.id, "REJECTED")}
                          isLoading={isUpdating === request.id}
                          className="h-9 w-9 p-0 rounded-xl bg-red-500/5 hover:bg-red-500/20 text-red-500 border border-red-500/10 flex items-center justify-center"
                        >
                          <X size={16} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(request.id, "CONFIRMED")}
                          isLoading={isUpdating === request.id}
                          className="h-9 px-4 rounded-xl bg-neon text-black font-black italic uppercase tracking-widest text-[9px] hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <div className="text-[9px] font-black text-white/20 uppercase tracking-widest italic select-none">
                        Verified
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-white/10">
                      <AlertCircle size={32} strokeWidth={1.5} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">No membership requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Payment Proof" className="rounded-3xl shadow-2xl border border-white/10" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/40 hover:text-white transition-colors flex items-center gap-2"
            >
              <X size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    CONFIRMED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest italic ${styles[status] || styles.PENDING}`}>
      {status === "PENDING" && <Clock size={10} />}
      {status === "CONFIRMED" && <Check size={10} />}
      {status === "REJECTED" && <X size={10} />}
      {status}
    </div>
  );
}
