# Technical UI Architecture: Padel Court Booking System (Next.js)

Dokumen ini adalah terjemahan teknis dari UI/UX Design Plan menjadi struktur pengembangan spesifik untuk lingkungan *Next.js (App Router)*, React, dan integrasi *Tailwind CSS* tingkat lanjut.

## 1. Konsep Visual & Inspirasi Antarmuka (Aesthetic Details)
Desain visual akan mentransmisikan napas teknologi olahraga terkini yang segar, premium, namun mengedepankan kecepatan konversi:
- **Inspirasi UI:** Struktur tata letak meminjam landasan arsitektur platform raksasa pemesanan olahraga raket di dunia seperti **Playtomic** atau **MATCHi** (Gaya pemetaan grid waktu, saringan tanggal menyamping), dikawinkan dengan arsitektur elegan ultra-bersih (*clean minimalist*) layaknya **Airbnb** untuk formasi halaman properti dan **Linear** untuk kepadatan *dashboard* tabel.
- **Palet Warna Sporty (Color Palette):**
  - **Electric / Neon Accent:** Penggunaan *Neon Lime* (`#bef264` / `lime-300`) atau *Vibrant Emerald* (`#10b981`) sebagai warna pemanggil pemicu aksi utama (menyimbolkan pantulan cerah bola Padel).
  - **Midnight Core (Dark Premium):** Elemen pemegang teks tubuh dan atap pendaratan (Header) dibingkai menggunakan warna *Deep Slate/Charcoal* (`#0f172a` / `slate-900`) menggantikan hitam total, menghadirkan estetika premium yang tajam.
  - **Latar Belakang Bersih:** Bidang antarmuka memisahkan kartu satu dan lain bukan dengan garis kasar, melainkan menaruh elemen di atas kanvas `bg-slate-50` yang sejuk.
- **Modern Card Styling:**
  - Kartu (*Cards*) tidak lagi bersudut tajam kuno, melainkan mengusung *border-radius* radikal ekstra membundar (`rounded-2xl` atau `rounded-3xl` berkalibrasi ~16px-24px).
  - Mengandalkan transisi rona bayangan halus lapis dua (*Soft diffuse drop shadow*) ketimbang tepian garis pekat (Contoh: `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).

## 2. Struktur Folder Komponen (`src/components/`)
Aplikasi dipecah menginduk pada arsitektur isolasi batas fitur (*Feature-based isolation*) digabungkan dengan entitas atomik (`ui/`):

```plaintext
src/
└── components/
    ├── ui/                 # (Komponen dasar dapat digunakan berulang / atomic)
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── Input.tsx
    │   ├── Modal.tsx
    │   └── Badge.tsx
    ├── layout/             # (Komponen pembungkus penataan halaman mutlak)
    │   ├── Navbar.tsx
    │   ├── Footer.tsx
    │   ├── SidebarAdmin.tsx
    │   └── PageContainer.tsx
    ├── booking/            # (Komponen spesifik modul operasional kalender)
    │   ├── CourtSwipeSelector.tsx
    │   ├── DateScrollPicker.tsx
    │   ├── TimeSlotGrid.tsx
    │   ├── TimeSlotButton.tsx
    │   └── BookingSummarySticky.tsx
    ├── admin/              # (Komponen spesifik fungsional instrumen staf)
    │   ├── DashboardStatMetric.tsx
    │   ├── VerificationDataTable.tsx
    │   └── VerifyPaymentModal.tsx
    └── shared/             # (Komponen pembantu lintas fitur)
        ├── DropzoneUploader.tsx
        └── EmptyStateIllustration.tsx
```

## 3. Breakdown Komponen & Struktur Props (TypeScript Interfaces)

Pengetikan kokoh (*Strong-typing*) disusun sebagai pondasi arsitektur agar tak ada kebocoran transmisi data antar halaman di lingkungan React.

### A. Komponen UI Dasar (`components/ui`)

**1. `Button.tsx`**
Merangkul segala intervensi navigasi dan ajuan form peladen.
```tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'full';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
// Render: Menyisipkan <svg className="animate-spin" /> jika isLoading=true
```

**2. `Card.tsx`**
Pembungkus estetis penyebaran informasi blok modular.
```tsx
export interface CardProps {
  children: ReactNode;
  className?: string; // Menerima utilitas Tailwind suntikan untuk padding (p-4 vs p-8)
  onClick?: () => void;
  elevateOnHover?: boolean; // Pemicu animasi 'hover:-translate-y-1 hover:shadow-lg'
}
```

**3. `Badge.tsx`**
Pil penyampai warta label di dasbor atau kotak keranjang.
```tsx
export interface BadgeProps {
  status: 'AVAILABLE' | 'PENDING' | 'WAITING_APPROVAL' | 'CONFIRMED' | 'REJECTED';
  textOverride?: string; // Opsi mengganti kata tampil
}
// Konsepsi Logic Tailwind: 
// CONFIRMED -> 'bg-emerald-100 text-emerald-700'
// WAITING_APPROVAL -> 'bg-amber-100 text-amber-700'
```

### B. Komponen Fitur Transaksional Booking (`components/booking`)

**1. `DateScrollPicker.tsx`**
Sabuk geser horizontal pencarian rentang hari kalender penyewaan.
```tsx
export interface DateScrollPickerProps {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
  daysAhead?: number; // Batasat maksimal, cth: 14 hari ke depan
}
```

**2. `TimeSlotButton.tsx`**
Ubin jam parsial yang menyusun susunan matriks kisi waktu harian.
```tsx
export interface TimeSlotButtonProps {
  timeLabel: string; // e.g., "19:00 - 20:00"
  priceRaw: number; 
  statusState: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
  isSelected: boolean;
  onSlotToggle: (timeLabel: string) => void;
}
```

**3. `BookingSummarySticky.tsx`**
Bilangan merapat lengket di alas sepatu layar (*Sticky floating bottom*) yang membisikkan rekap tagihan pada tahap pasca-seleksi *Timeslot*.
```tsx
export interface BookingSummaryStickyProps {
  courtNameLabel: string;
  totalSelectedHours: number;
  grossPrice: number;
  onProceedCheckout: () => void;
  isSubmittingServer?: boolean;
}
```

### C. Komponen Peladen Dashboard Staf Khusus (`components/admin`)

**1. `VerificationDataTable.tsx`**
Pangkalan baris penyajian dokumen menanti kepastian rilis.
```tsx
// Struktur Data Acuan Baris
export interface AdminBookingRow {
  bookingId: string;
  customerName: string;
  courtDetails: string;
  bookedRange: string; // "12 May, 19:00"
  totalAccAmount: number;
  paymentProofImageURL: string | null;
  status: string;
}

export interface VerificationDataTableProps {
  queueData: AdminBookingRow[];
  onOpenProofViewer: (bookingToken: AdminBookingRow) => void; 
}
```

**2. `VerifyPaymentModal.tsx`**
Kubah raksasa pengangkatan layar foto faktur pembayaran guna penelitan visual operator.
```tsx
export interface VerifyPaymentModalProps {
  isOpen: boolean;
  onCloseLayer: () => void;
  bookingTarget: AdminBookingRow | null;
  onActionApprove: (id: string) => Promise<void>;
  onActionReject: (id: string, reasonFallback: string) => Promise<void>;
  isMutatingState?: boolean; // Meniadakan klik kedua kali saat pangkalan data memuat konfirmasi
}
```

## 4. Eksekusi Gaya Parameter Tailwind Khusus (Visual CSS Mapping Code)

Berdasarkan inspirasi antarmuka di bagian pertama, berikut padanan serapan blok kelas `className` utilitas murni di Tailwind CSS untuk mencapai presisi wujud rancangan rekayasa:

### **A. Formulir Ubin Waktu Pemesanan Aktif Bertaut (Selected Active Time Slot):**
Memancarkan letupan aura sporty menyala, menyuguhkan pembedaan warna amat jauh dari rona sekitarnya tanpa membuat teks kabur.
```tsx
<button
  className="w-full relative px-4 py-3 bg-lime-300 text-slate-900 border-[2.5px] border-lime-400 font-extrabold text-sm rounded-xl transform scale-[1.03] transition-all duration-200 shadow-sm"
>
  19:00 - 20:00
</button>
```

### **B. Formulir Ubin Waktu Modar/Terpesan Ganda (Disabled/Booked Time Slot):**
Konsep menghapus distraksi. Elemen direndam agar menyatu dengan palet kanvas latar, menyematkan batas garis semu agar mata dengan lekas melampaui ke area fungsional lain.
```tsx
<button
  disabled 
  className="w-full px-4 py-3 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed border-dashed border-2 border-slate-200 rounded-xl font-medium text-sm"
>
  Ludes (Booked)
</button>
```

### **C. Modern Glass-Elevated Card (Kartu Pemilihan Lapangan/Court Card):**
Menghampiri kesan minimal tinggi yang dianut ranah estetika properti semacam pelenyapan sudut sikuan tajam. Sentuhan `hover:shadow-lg` menghasilkan kedalaman peninggian optikal pada kartu seolah menantang jemari mendesaknya turun.
```tsx
<div 
  className="flex flex-col bg-white rounded-3xl p-5 shadow-[0_4px_24px_-4px_rgba(37,99,235,0.08)] border border-slate-100 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_-6px_rgba(37,99,235,0.12)] transition-all duration-300 cursor-pointer"
>
  {/* Konten Gambar & Teks */}
</div>
```

### **D. Notifikasi Dasbor Lencana Menggantung (Floating Action Button / Checkout Bridge):**
Wujud antarmuka bayangan pelindung yang terpasak permanen ke tepi gawai, siap mencaplok ibu jari ketika *timing* penyelesaian tagihan datang di modul pemilihan. Berbasis latar warna gelap solid guna memberi keheningan transaksional konversi tinggi.
```tsx
<div
  className="fixed bottom-0 left-0 w-full bg-slate-900 text-white rounded-t-3xl p-6 shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.2)] flex justify-between items-center z-50 backdrop-blur-md"
>
   {/* Narasi Tagihan (Kiri) dan Tombol Checkout Lime/Emerald (Kanan) */}
</div>
```

Dokumen perincian ini menjamin pemogram *Frontend Engineering* tak lagi meraba fungsional apa yang melintas pada properti Props reaktif atau kelas mana yang harus dipahat manual. Kode dipecah selaras ke harmonisasi komponen fungsional yang terisolasi dan mudah dikelola ulang (*Highly Scalable and Maintainable Components*).
