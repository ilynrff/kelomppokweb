"use client";

import { useBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { CourtCard } from "@/components/booking/CourtCard";
import { TimeSlot } from "@/components/booking/TimeSlot";
import { useState } from "react";
import Image from "next/image";

export default function BookingPage() {
  const {
    courts,
    timeSlots,
    isLoadingSlots,
    dates,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    setSelectedSlots,
    toggleSlot,
    checkout,
    isLoading,
    error,
    successMsg,
    isToastOpen,
    setIsToastOpen
  } = useBooking();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewCourtInfo, setPreviewCourtInfo] = useState<string | null>(null);

  const selectedCourtData = courts.find(c => c.id === selectedCourt);
  const courtPrice = selectedCourtData?.pricePerHour || 0;
  const totalPrice = courtPrice * selectedSlots.length;

  const isStep1Done = !!selectedCourt;
  const isStep2Done = !!selectedDate;
  const isStep3Done = selectedSlots.length > 0;
  const canCheckout = isStep1Done && isStep2Done && isStep3Done;

  const handleCheckoutClick = () => {
    if (canCheckout) {
      setShowConfirmModal(true);
    }
  };

  const executeCheckout = () => {
    setShowConfirmModal(false);
    checkout();
  };

  let smartSuggestion = null;
  if (selectedCourt && selectedDate) {
    const firstUnavailableIndex = timeSlots.findIndex(s => !s.available);
    if (firstUnavailableIndex !== -1) {
      const nextAvailable = timeSlots.slice(firstUnavailableIndex).find(s => s.available);
      if (nextAvailable) {
        smartSuggestion = `Tip: Jam buka terdekat yang masih kosong adalah ${nextAvailable.time}`;
      }
    }
  }

  return (
    <div className="flex-1 bg-slate-50 relative pb-40 pt-8">
      <Toast 
         isOpen={isToastOpen} 
         message={error || successMsg} 
         type={error ? 'error' : 'success'} 
         onClose={() => setIsToastOpen(false)} 
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Konfirmasi Booking</h3>
            <p className="text-slate-500 font-medium mb-6">Periksa kembali detail pesanan kamu sebelum melanjutkan.</p>
            
            <div className="bg-slate-50 rounded-2xl p-5 space-y-3 mb-6 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Lapangan</span>
                <span className="font-bold text-slate-900 text-right">{selectedCourtData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Lokasi</span>
                <span className="font-bold text-slate-900 text-right">{selectedCourtData?.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tanggal</span>
                <span className="font-bold text-slate-900">{selectedDate.getDate()} {selectedDate.toLocaleDateString('id-ID', { month: 'long' })}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Jam</span>
                <span className="font-bold text-slate-900 text-right max-w-[150px]">
                  {selectedSlots.join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Durasi</span>
                <span className="font-bold text-slate-900">{selectedSlots.length} Jam</span>
              </div>
              
              <div className="pt-3 border-t border-slate-200 mt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Harga</span>
                <span className="text-2xl font-black text-blue-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="w-full" onClick={() => setShowConfirmModal(false)}>Batal</Button>
              <Button className="w-full" onClick={executeCheckout} isLoading={isLoading}>
                {isLoading ? 'Memproses...' : 'Ya, Bayar Sekarang'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewCourtInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setPreviewCourtInfo(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewCourtInfo(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors">
              ✕
            </button>
            <div className="relative h-64 md:h-80 w-full bg-slate-200 flex items-center justify-center">
              {(() => {
                const previewCourt = courts.find(c => c.id === previewCourtInfo);
                if (previewCourt?.image) {
                  return <Image src={previewCourt.image} alt="Court" fill className="object-cover" />;
                }
                return <p className="font-bold text-slate-400">Padel Court Banner</p>;
              })()}
            </div>
            <div className="p-6 md:p-8">
              {(() => {
                const previewCourt = courts.find(c => c.id === previewCourtInfo);
                return (
                  <>
                    <div className="inline-block bg-blue-100 text-blue-700 font-bold text-xs px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Detail Lapangan</div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{previewCourt?.name || "Detail Lapangan"}</h3>
                    <p className="text-slate-500 font-medium flex items-center gap-2 mb-6">
                       📍 {previewCourt?.location || "Lokasi belum ditentukan"}
                    </p>
                    <p className="text-slate-600 leading-relaxed font-medium mb-8">
                      {previewCourt?.description || "Nikmati bermain padel di lapangan premium dengan standar internasional. Dilengkapi dengan fasilitas terbaik, pencahayaan anti-silau, dan lingkungan yang asri."}
                    </p>
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-500">Harga Per Jam</span>
                      <span className="text-xl font-black text-blue-600">Rp {(previewCourt?.price || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">Booking</h1>
          <p className="text-slate-500 font-bold text-lg">Pilih lapangan, tentukan tanggal, lalu amankan jam mainmu.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
          <div className="space-y-12 w-full">
            
            {/* 1. Select Court */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-colors ${selectedCourt ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-100 text-blue-600'}`}>
                  {selectedCourt ? '✓' : '1'}
                </div>
                <h2 className="text-xl font-bold text-slate-900">Pilih Lapangan</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {courts.length === 0 && <p className="text-slate-400 font-bold col-span-3">Memuat lapangan...</p>}
                {courts.map((court) => (
                  <div key={court.id} className="relative group">
                     {/* Preview Button */}
                     <button onClick={(e) => { e.stopPropagation(); setPreviewCourtInfo(court.id); }} className="absolute top-4 left-4 z-20 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity" title="Lihat Detail">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                     </button>
                     <CourtCard 
                       court={court}
                       isSelected={selectedCourt === court.id}
                       onSelect={() => { 
                         setSelectedCourt(court.id); 
                         setSelectedSlots([]); 
                       }}
                     />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Select Date */}
            <div className={`space-y-5 transition-opacity duration-300 ${!isStep1Done ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-colors ${selectedDate ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-600'}`}>
                  {selectedDate && isStep1Done ? '✓' : '2'}
                </div>
                <h2 className="text-xl font-bold text-slate-900">Pilih Tanggal</h2>
              </div>
              <div className="flex overflow-x-auto gap-3 pt-3 pb-6 px-2 -mx-2 snap-x hide-scrollbar">
                {dates.map((d, idx) => {
                  const dayStr = d.toLocaleDateString("id-ID", { weekday: 'short' });
                  const dateNum = d.getDate();
                  const isSelected = selectedDate === dateNum;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => { setSelectedDate(d); setSelectedSlots([]); }}
                      className={`flex-shrink-0 snap-start flex flex-col items-center justify-center w-[84px] h-[100px] rounded-3xl border-2 transition-all duration-200 active:scale-95 ${
                        selectedDate.toDateString() === d.toDateString() 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-[0_10px_20px_-8px_rgba(0,0,0,0.5)] transform -translate-y-1' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:shadow-md hover:-translate-y-1'
                      }`}
                    >
                      <span className={`text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{dayStr}</span>
                      <span className="text-3xl font-black mt-1 text-current">{dateNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Time Slots */}
            <div className={`space-y-5 transition-opacity duration-300 ${!isStep2Done ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-colors ${isStep3Done ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-600'}`}>
                    {isStep3Done ? '✓' : '3'}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Pilih Jam Main</h2>
                </div>
                {smartSuggestion && (
                  <div className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 animate-in fade-in slide-in-from-right-4">
                    ✨ {smartSuggestion}
                  </div>
                )}
              </div>
              
              {!selectedCourt ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white">
                  <p className="text-slate-500 font-bold">Pilih lapangan terlebih dahulu untuk melihat jadwal.</p>
                </div>
              ) : isLoadingSlots ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white animate-pulse">
                  <p className="text-slate-500 font-bold">Mengecek ketersediaan server realtime...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {timeSlots.map((slot, idx) => (
                    <TimeSlot 
                      key={idx}
                      time={slot.time}
                      isAvailable={slot.available}
                      isSelected={selectedSlots.includes(slot.time)}
                      price={courtPrice}
                      onSelect={() => toggleSlot(slot.time)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden lg:block sticky top-24">
             <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h3 className="font-black text-xl mb-6">Ringkasan Detail</h3>
                
                <div className="space-y-4 mb-6 relative">
                  <div className="absolute left-[9px] top-4 bottom-4 w-0.5 bg-slate-100 -z-10 rounded-full"></div>

                  <div className="flex gap-4">
                     <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-4 border-white shadow-sm ${isStep1Done ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lapangan</p>
                       <p className={`font-bold ${isStep1Done ? 'text-slate-900' : 'text-slate-300'}`}>
                         {selectedCourtData?.name || "Belum dipilih"}
                       </p>
                     </div>
                  </div>

                   <div className="flex gap-4">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-4 border-white shadow-sm ${isStep2Done ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tanggal</p>
                        <p className={`font-bold ${isStep2Done ? 'text-slate-900' : 'text-slate-300'}`}>
                          {selectedDate ? `${selectedDate.getDate()} ${selectedDate.toLocaleDateString('id-ID', { month: 'long' })}` : "Belum dipilih"}
                        </p>
                      </div>
                   </div>

                  <div className="flex gap-4">
                     <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-4 border-white shadow-sm ${isStep3Done ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                     <div className="w-full">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Jam Main</p>
                       <div className={`font-bold flex flex-wrap gap-1 ${isStep3Done ? 'text-slate-900' : 'text-slate-300'}`}>
                         {isStep3Done ? (
                            selectedSlots.map(s => (
                              <span key={s} className="bg-slate-100 px-2 py-0.5 rounded-md text-sm">{s}</span>
                            ))
                         ) : "Belum dipilih"}
                       </div>
                     </div>
                  </div>
                </div>
                
                <div className="pt-5 border-t border-slate-100 mb-6 bg-slate-50 -mx-6 px-6 pb-2">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-sm font-bold text-slate-500">Harga per jam</span>
                     <span className="text-sm font-bold text-slate-900">Rp {courtPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-sm font-bold text-slate-500">Durasi</span>
                     <span className="text-sm font-bold text-slate-900">{selectedSlots.length} Jam</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-200 pt-3">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Biaya</span>
                     <p className="text-3xl font-black text-blue-600">
                       Rp {totalPrice.toLocaleString('id-ID')}
                     </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    size="full" 
                    disabled={!canCheckout} 
                    onClick={handleCheckoutClick} 
                    isLoading={isLoading}
                    className="shadow-lg hover:shadow-xl transition-all"
                  >
                    Konfirmasi Booking
                  </Button>
                  {!canCheckout && (
                    <p className="text-center text-xs font-medium text-slate-400">
                      *Lengkapi pilihan di atas terlebih dahulu
                    </p>
                  )}
                </div>
             </div>
          </div>

        </div>
      </div>

      <div className={`lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 rounded-t-3xl p-5 px-4 shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.15)] z-40 transform transition-transform duration-500 ${selectedSlots.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full flex justify-between items-end">
            <div>
              <p className="text-slate-500 font-bold text-xs mb-1">
                {selectedCourtData?.name || "Lapangan"} • {selectedSlots.length} Jam
              </p>
              <p className="text-2xl font-black text-blue-600 leading-none">
                Rp {totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <Button size="full" onClick={handleCheckoutClick} isLoading={isLoading} disabled={!canCheckout}>
            Booking Sekarang
          </Button>
        </div>
      </div>

    </div>
  );
}
