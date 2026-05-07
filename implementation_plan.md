# Implementation Plan: Frontend UI/UX Booking System

Pembangunan struktur *frontend* utuh menggunakan Next.js (App Router) dan Tailwind CSS, merealisasikan rujukan "Technical UI Architecture" menjadi kode *React* yang fungsional secara serentak. Rencana ini mengatur peletakan halaman dan sistem komponen *reusable* yang rapi.

## User Review Required

> [!WARNING]
> Sistem saat ini memiliki beberapa galat di modul API (*backend*). Berdasarkan instruksi Anda untuk **menggunakan *dummy data / dummy handler* secara eksplisit** karena belum perlu terhubung *backend*, saya akan **fokus 100% mendesain fungsionalitas UI secara *mock-up frontend***. Seluruh interaksi form, tanggal, daftar jadwal pemesanan, dan dasbor admin ditopang variabel *state simulator* statis yang responsif, memastikan tampilan UI memukau dan sempurna tanpa terganggu hambatan basis data. Silakan aminkan jika pendekatan *Dummy Component* ini cocok untuk iterasi ini.

## Proposed Changes

---

### Struktur Basis UI dan *Folder*

Menyesuaikan direktori `styles/` dan pembuatan wadah komponen spesifik `ui/`.

#### [NEW] [globals.css](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/styles/globals.css)
Memindahkan titik pusat penyusunan CSS global Tailwind dari `app/` menuju direktori sentralistik baru di `src/styles/globals.css`. Menyuntikkan konvensi warna neon sporty, variabel bayangan, dan aturan kursor di dalamnya.

#### [MODIFY] [layout.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/app/layout.tsx)
Mengubah titik jalur impor rujukan `globals.css` pada *Root Layout* sekaligus penyesuaian kelas dasar pembungkus antarmuka yang relevan dengan skema neon *Charcoal/Slate*.

#### [MODIFY] [Navbar.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/components/Navbar.tsx)
Mempercantik desain menu menjadi lebih mutakhir. Menu navigasi akan memuat bilah: `Home`, `Booking`, `Dashboard`, dan aksi `Login`. Membenahi tipe peringatan *auth-session* TypeScript di dalamnya bila perlu dijauhkan sementara.

---

### Perakitan Kumpulan Modul *React Component (`components/ui`)*

Sistem desain modular penunjang fondasi interaktif di tiap halaman.

#### [NEW] [Button.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/components/ui/Button.tsx)
Kerangka fungsional penyaluran prop aksi *(Primary, Secondary)* berfitur pengolah penundaan pemuatan *(Loading spinners)*.

#### [NEW] [Card.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/components/ui/Card.tsx)
Rangka pelapis bergaya kontemporer menyajikan fitur *elevated modern rounded shadow* dengan respon hover transisi statis nan ringan.

#### [NEW] [Input.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/components/ui/Input.tsx)
Elemen *Form Field* responsif pencatat entri data untuk skenario halaman otorisasi.

#### [NEW] [Badge.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/components/ui/Badge.tsx)
Penyematan ragam status warnawi kapsul: *Available (Hijau terang)*, *Booked (Kelabuk)* maupun *Pending (Oranye).*

#### [NEW] [Modal.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/components/ui/Modal.tsx)
Komponen penahan gerak *overlay pop-up*. Diadaptasi sebagai pembulat layar pengecek foto bukti di Admin.

#### [NEW] [Spinner.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/components/ui/Spinner.tsx)
Animasi ikonik untuk disematkan saat *state* merender kosong.

---

### *Refactoring / Creation* Halaman Antarmuka Utuh (*Pages*)

Penulisan spesifik tiap blok `page.tsx` mereplikasi pedoman rencana antarmuka *UI Booking*. 

#### [MODIFY] [page.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/app/page.tsx)
**Landing Page**: Implementasi *Hero Section* modern, tombol dorongan seruan *"Book Now"*, daftar tampilan kartu perkenalan lapangan (Mock Data A, B, C), diakhiri Footer informasional konvensional simpel.

#### [MODIFY] [login/page.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/app/(auth)/login/page.tsx)
**Form Login**: Kombinasi kerangka *Card* dan *Input Form*. Pengaplikasian visual *Error Messages* simulasi dan responsi statis reaksi saat salah ketik. 

#### [MODIFY] [register/page.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/app/(auth)/register/page.tsx)
**Form Register**: Berbagi estetika sama sembari memiliki validasi form minimal di lintasan klien (*Client hooks required field*).

#### [NEW] [page.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/app/booking/page.tsx)
**Utama - Halaman Booking**: Sentralitas pengembangan kompleks. Tatanan memuat opsi geser lapangan ubin (`Cards`), seleksi tanggal menyamping *Horizontal Picker*, ubin *Grid Time Slots* ketersediaan, komparasi rupa kosong vs terpinang, disatukan pemicu navigasi transaksi menempel mantap di pojok bawah (*Sticky Button Float*). Ditopang konjungsi variabel lokal (*React useState*).

#### [MODIFY] [page.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/app/dashboard/page.tsx)
**Dashboard Klien**: Tabel atau wujud serangkaian *Bento card list* pemaparan transaksi simulasi masa silam serta jadwal lunas (*Mock Objects Array*).

#### [NEW] [page.tsx](file:///c:/Users/user/OneDrive/Dokumen/IFILYWeekly/padel-booking/src/app/admin/page.tsx)
**Dashboard Manajer/Admin**: Ruang tabel pemesanan memamerkan `Status Booking`, kolom tombol "Verifikasi" picu aksi melahirkan komponen Jendela Modal Setuju/Tolak mutasi semu status pesanan pelanggan bersangkutan.

## Verifikasi Plan

### Uji Kelengkapan UI (*Responsiveness Metrics*)
Akan digunakan utilitas simulasi rendering *Tailwind CSS*:
- Penegakan formasi di atas perangkat penyusutan ekstrem sempit (`< 768px`).
- Penyatuan gaya hover (reaksi kursor tetikus memicu efek *uplift/translation Y*) pada komponen kardus lapangan (*Cards* dan Jam balok ubin aktif).

## Open Questions
-  Folder saat ini `src/app/courts` tampaknya merupakan inisiasi rancangan terdahulu. Pada tahap revisi tata letak kali ini, saya akan mengganti logika pemesanan dengan membangun direktori baru absolut `src/app/booking/page.tsx` sebagaimana instruksi Anda, dan Anda dapat menavigasikannya dari halaman utama.
