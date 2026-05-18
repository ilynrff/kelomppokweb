# UI/UX Design Plan: Padel Court Booking System

## 1. Design Overview
- **Konsep Desain:** Aplikasi ini mengusung fondasi identitas visual bergaya **Modern, Clean, dan Sporty**. Desain antarmuka menitikberatkan pada ruang kosong (*whitespace*) yang terstruktur sangat elegan mengikuti tata letak minimalis nan modern (*ala platform desain Linear*). Aksen visual memadukan spektrum warna vibran energi olahraga Padel untuk mempertegas identitas, tanpa membuat mata lelah ketika ditatap dalam durasi berulang.
- **Target Pengalaman Pengguna (User Experience Goals):** Menyuguhkan sirkulasi pengalaman bernapaskan fundamental **Mobile-First**. Perambanan menuntut perpindahan muatan antar blok yang ekstra *cepat* dan *simple*. Arsitektur elemen dimodifikasi agar pengguna di rentang usia apapun bisa mendaratkan jemari dan menyelesaikan misi *checkout* pemesanan tak lebih dari dua menit tanpa kurva pembelajaran aplikasi baru.

## 2. Design Principles
Pemetaan seluruh komponen akan tunduk ketat pada filosofi fundamental desain antarmuka berikut:
- **Usability (Ketepatgunaan Instan):** Sasaran pemicu aksi paling penting (Seperti tombol "Pilih Jam" maupun "Unggah Bukti Bayar") akan bersauh kokoh di kawasan penekanan titik nyaman jempol pengguna (*Thumb-zone friendly*) ketika diramban pada mode telepon vertikal.
- **Consistency (Harmonisasi Konsisten):** Penerapan patokan radius elemen tombol/modul *Card*, keseragaman kerimbunan bobot palet warna Tailwind, serta formasi gaya *shadowing* dijauhkan dari improvisasi di luar landasan di dalam kesatuan UI (*Design system*).
- **Clarity (Kejelasan Absolut):** Sistem wajib merepresentasikan kondisi blok ketersediaan penyewaan di kalender pemesanan tanpa celah keraguan semantik (seperti benturan visual "Jadwal kosong (Aksen Cerah/Hijau/Biru)" dihadapkan mutlak melawan pendaratan blok "Pesan (Kelabu kusam, label tulisan tebal 'Booked', non-interaktif)").
- **Accessibility (Aksesibilitas Ramah Mata/Kontras):** Tiap cetakan tulisan dalam pelindung elemen latar (*Background*) menjamin kalkulasi rasio warna kontras AAA *Accessibility standard*. Lebar ketukan pemicu (*Hitbox target*) tidak kurang dimensi pijak 44x44px.

## 3. Struktur Halaman (Information Architecture)
Skema kerangka letak fondasi penelusuran arsitektur menu *Website* diotomasikan menjadi beberapa pilar halaman (*Pages*):
- **Landing Page:** Gerbang sambut publik. Fungsi berfokus menonjolkan ringkasan etalase citra fasilitas kualitas tinggi, tarif dasar, lalu membujuk tajam pengunjung via pancingan pintasan tombol menuju formulir registrasi kalender *(Call-to-Action)*.
- **Login / Register Page:** Pilar penyaringan batas dinding keamanan (*Auth Gate*). Halaman khusus penyediaan sarana entri formulir asupan pertukaran mandat kredensial pengguna agar otorisasi sesi NextAuth terjadi.
- **Booking Page:** Halaman paling utama berisi modul aplikasi reservasi terpusat. Berfungsi mengoordinasikan jalinan saringan tanggal interaktif (*Datepicker*) bertemu rentetan modul kotak matriks *Time-slot* yang langsung dipasok silang oleh integritas mesin basis data secara mutakhir (*real-time*).
- **Dashboard User:** Kantung administratur teritorial sang klien pemesan. Tersedia melayani pemetaan rentetan visual tabel rekam asuransi interaksi historis pengguna terhadap properti penyewaan (mengecek mana bon kas yang diterima sah vs status tunda tertolak).
- **Admin Dashboard:** Layar monitor mahkota manajemen operasional punggawa panti (*Backoffice*). Menjabarkan wewenang tunggal dasbor yang melabuhkan modul rangkuman agregasi pendataan mingguan, memodifikasi pangkalan daftar aset lapangan baru di dalam sistem, serta meresmikan pengungkit validasi akhir penerimaan gambar unggahan nasabah.

## 4. Wireframe (Deskripsi Layout Layar)
Spesifikasi penguraian sketsa penyusunan sumbu *Layout Box* untuk transisi pembuatan wadah pembungkus komponen React:

### A. Landing Page Layout
- **Navbar (Tetap/Sticky di Atas):** Bentangan menu mendatar yang dikoyak pembagi sisi di tengah. Sisi ekstensi paling kiri logo citra (*Brand / Padel*). Rangka tengah *Links* rujukan `[Fasilitas, Jadwal, Kontak]` (menjadi laci geser tiga baris pada perangkat gawai lebar *Mobile*). Sayap kanan melebarkan sayap kumpulan aksi mandiri tombol hantu `[Login]` disamping tombol berisi warna utuh primer `[Daftar Akun]`.
- **Hero Section (Bawah Navbar):** Menduduki *100vh* bentangan latar belakang grafis fotografi arena. *Focus of attention* tulisan tebal besar tersemat mendominasi horizontal tengah atau rata-kiri (*Header/H1 Headline*). Ditopang oleh pembenaran tombol aksi utama "*Booking Lapangan Sekarang ->*" super besar menyelimuti pijakan visual.
- **Section Informasi Lapangan (Kolom Fleksibel):** Pangkalan *Grid layout* adaptif baris (1 baris x 3 potong *Cards* pada layar luas horizontal | bergulir baris vertikal pada layar *Mobile*). Masing-masing memuat foto balok ubin (*Thumbnail*), narasi kualitas premium, detail tarif, fitur lantai arena, serta tombol reservasi berukuran kompak sekunder.

### B. Login & Register Layout
- **Struktur Form (Pusat Sentralisasi Ruang):** Menerapkan format bingkisan belah sumbu pada Layar monitor luas (Kiri kanvas polos menyemat modul formulir Login rata-tengah | Kanan bingkai gambar grafis fasilitas estetis pengisi kekosongan). Pada Gawai kecil form mendarat pada bingkisan putih meninggi dengan tepian bundar halus yang mengambang memusat (*Center-Floating box*).
- **Input Fields:** Deret susunan vertikal tegak lurus `Flex-col`. Menggunakan gaya "*Floating Label Minimalis*" pada setiap pelatuk *(Email Address & Password)*. Diakhiri di sisi tepi dengan perancangan peringatan kata kunci tak lazim terlewat asupan.
- **Button (Pemicu Utama):** Penyesuaian tombol rentang utuh melangkahi panjang kolom `w-full`, menjulang tinggi kokoh di bawah input.
- **Error Message:** Merangkak tersirat tepat di tapak pijak baris sumbu input terkait berupa corak selipan teks sirah kemerahan kecil seketika tervalidasi gagal (`z-index` peninggi *overlap* halus transisi opasitas).

### C. Booking Page (Kalender Utama) Layout
- **Filter Section / Date Picker (Zona Paling Atas di bawah Nav):** Rangkaian komponen geser navigatif horizontal pada tanggal hari aktif seminggu kedepan (Memanjakan ibu jari menggulung). Memuat indikator penonjolan lingkaran latar kontras (*Pill active-state*) mengunci "Hari Terpilih".
- **List Pilih Lapangan - Card Slicer (Pusat Perhatian):** Laci tumpukan blok lapangan disematkan horizontal pada *Viewport mobile* memamerkan citranya seukuran `[Padel A]`, `[Padel Indoor B]`. 
- **Time Slot Picker / Grid Matriks (Kawasan Inti Tegah-Bawah):** Penyusunan deret *Grid Container*, membentang sel ubin/bingkai waktu (contoh *"09:00 - 10:00"*, *"10:00 - 11:00"*). Status ubin secara hierarki mengadopsi tiga modul state:
  - *Status Dibooking*: Pengaburan warna menyatu ke kanvas kelabu (`bg-slate-200 / text-slate-400`). Matikan telunjuk interaksi `disabled`.
  - *Status Tersedia*: Perwajahan kawat bersiluet garis tepi biru/hijau pudar mengundang pemicuan klik (`border border-blue-200 bg-white`).
  - *Status Terpilih (Active)*: Letupan warna balok mekar sempurna, solid memenuhi modul memancarkan teks kontras warna primer tebal.
- **Button Lanjut Reservasi (Floating Menempel Bawah / Sticky `bottom-0`):** *Card* merumput kecil merekatkan layar pelamar berisikan naratif `Ringkasan Total: Rp.200K`. Tombol utuh di sebelahnya menunggu sentuhan untuk mengeksekusi navigasi tahap Ringkasan (*Checkout Summary & Uploads*).

### D. Dashboard User Layout
- **Layout Tepi (*Sidebar/Toolbar*):** Terikat di sisi pojok/sisi atas membeberkan Nama Profil/Email dan Navigasi Riwayat.
- **List Booking Aktif yang Membutuhkan Validasi Tunggakan (Kanan Atas/Senter):** Membentuk jajaran *Card Box* peringatan besar mencolok. Bila menemukan jadwal *Pending* atau *Menunggu Pembayaran*, ia mencuri singgasana paling menjuluk berlabel kunyit. Mendominasi sebuah aksi seruan "Silakan unggah Berkas Resi - Klik di Titik Ini".
- **Tabel Riwayat Booking Kelam (Sumbu Dasar):** Modul struktur berbalut barisan kolom sederhana memanjang *Row* (`[Tgl main | Ruangan | Tarif Keluar | Status Penahanan Pembayaran]`). Kolom *Status* menyemat perwakilan perabotan rupa lencana (*Lozenges / Badges*).

### E. Admin Dashboard Layout
- **Sidebar Navigasi Tetap (*Fixed Sidebar Desktop / Kiri*):** Wadah menu menempel mutlak mengarsip kanal "Otoritas `[Semua Transaksi, Menunggu Verifikasi, Fasilitas Management, Sign-off]`".
- **Kanvas Sumbu Atasan (*High Level Metrics*):** Jejeran kotak statistik pelaporan ringkasan di atap sumbu mendatar (e.g., 3 Modul kotak merangkum `Saldo Hari Ini`, `Verifikasi Tertunda: [4]`, `Total Booking Masuk`).
- **Verifikasi Pembayaran Tabel (*Core Interaction View*):** Ekstraksi barisan tabel meruang horizontal sangat adaptif merangkum rincian masukan pemesan. Satu kolom tersendiri di ujung kanan bersauhkan sebuah tuas kancing interaktif menuntut "**Periksa Bukti Lampiran**".
- **Eksekusi Komando (Modal Viewer):** Menginvokasi tumpangan kanvas ter-redup bayang pelindung (*Darkened Overlay View*). Menajamkan kanvas utama lukisan foto bukti transfer di hadapan wajah admin perantau. Menyajikan tepat dua modul tindakan berseberangan jarak jauh di kaki gambar: Tombol berpelindung siluet api (*Error-Red*) berlabel **TOLAK**, dan Tombol pengukuh primer berlabel tebal solid **SETUJUI KLAIM**.

## 5. Komponen UI (React Component System)
Dokumentasikan pengadaan kerangka unit independen penyusunan antarmuka *Reusable* (*Atomic Design System* modular):

1. `Navbar`: Wadah menara tancap komando pelayaran antarmuka atas *(Properties arg: logoURL, userStateAuth Session)*.
2. `Button`: Mesin interaksi ketuk. *(Variants: `intent = "primary" | "secondary" | "outline" | "danger"`, `size = "sm" | "md" | "lg"`, `isLoading = boolean`)*. Saat state *Loading* disuntikkan, label teks tersapu berganti menjadi pengitari animasi pusaran putar *svg spinner circle*.
3. `Card`: Rangka fondasi penopang bongkah *container layout radius & bayang standard*. *(Components turunan: `CourtInfoCard`, `CheckoutSummaryCard`)*.
4. `Form Input`: Kolong integrasi penangkap tuts (*wrapper label & input text/password/file*). Memiliki kemampuan pengondisian detektor garis batas galat kemerahan bila validasi Zod *Schema backend* tertolak.
5. `Modal (Dialog)`: Konstruksi kotak sembul yang menyela lalu melumpuhkan interaksi pada lapis dokumen di baliknya (*Aksesibilitas Focus trap wajib dijaga aktif*). Berfungsi untuk *Preview Bukti* dan aksi kritikal persetujuan admin.
6. `Table`: Kompilasi susunan tular datar berbasis `<table>`, `<thead>`, dan `<tbody>` serbaguna penelan *Props Arrays data*.
7. `Badge Status`: Kapsul teks sangat minim (*Lozenges*) pemberi klu corak warna sesuai tingkatan kondisi pesanan (`success` (Hijau) | `verifying` (Kunyit) | `cancelled` (Kelabu)).
8. `Toast Notification`: Kanvas penyambung pengumuman terbang tanpa hambatan (*Snackbar notification*) yang timbul sekejap menyampiri pojok bawah, memberitahu pesan ringkas "*Jadwal Lapangan A berhasil terekam*" sebelum perlahan pudar setelah kurun rentang detik tertentu.

## 6. Design System (Konvensi Integrasi Tailwind CSS)
Sumbangsih panduan variabel arsitektural rujukan (*Design Tokens*) pada Tailwind `config.js`:

- **Warna Pokok Palet (*Brand Colors Palette*):**
  - **`Primary`:** Paduan *Electric Indigo* atau *Accent Blue-600* (`#4f46e5` atau `#2563eb`). Memancarkan energi aktif untuk selimut modul tombol aksi primer *(Call to actions)*.
  - **`Secondary` & *State*:** *Mint/Teal/Emerald-500* (`#10b981`) diutus menjadi corong verifikasi kalender yang disepakati 'Hijau'.
  - **`Neutral` (*Grayscale*):** Menetapkan keluarga corak *Slate* Tailwind murni (`slate-50` guna pendasaran alas layar yang bersih namun tak menyilaukan, `slate-800` guna tipografi teks batang tajam, dan `slate-200/300` sebagai garis batas dan kanvas penyesuaian non-interaktif blok waktu *disabled*).

- **Typography (*Hierarchy of Scale*):**
  - Mengandalkan font sistem serbaguna geometri modern seperti bingkisan kustomisasi font `Inter` atau varian gaya rupa lokal OS gawai bawaan (sangat berpadu ciamik dengan arsitektur UI murni *Linear* atau Apple ekosistem *Clean-cut*).
  - **Heading:** Pemampatan pengerutan spasi rentang antar huruf ditata erat `tracking-tight`, melenturkan bobot kekang kuat tebal `font-semibold` sampai pada ukuran raksasa judul *`text-3xl`* / *`text-4xl`*.
  - **Body Text:** Berbalut pewarnaan penjinak `text-slate-600`, bernasib rileks melayang lamat (`tracking-normal`, `font-normal`), ukuran memikat *`text-base`* standardisasi ukuran pembaca reguler (16px minimal *mobile-safe sizing*).

- **Spacing (Skala Penjarakan Ritme Ruang Kosong):** Skala berirama bawaan Tailwind (Kelipatan `4px` absolut). Melahirkan nafas celah *gap-4*, *margin-top-8* (`mt-8`), dan bantalan nafas kontainer `p-6`. Tak ada yang saling tindih mendesak.
- **Border Radius (Kurva Tepis Sentuhan):** Membuang segala sudut lancip kasar, memoles selimut luaran masukan dan kartu (*Cards*) merangkul estetika ramah gawai memeluk rentang `rounded-lg` (8px), sampai perpaduan lonjong murni tombol melingkar parameter *pill* berhulu `rounded-full`.
- **Shadows (Gradasi Bayang Kedalaman):** Lapis tingkat kartu dan rimpang navigasi bawah memancarkan bayang *Diffuse drop-shadow* minim sangat berhalus `shadow-sm` sampai parameter menumpuk layang untuk jendela popup Modal bertaraf pekat besar `shadow-2xl`.

## 7. User Interaction & Behavior
Meracik pengondisian siklus pergerakan status *feedback loop*:

- **Hover Effect (Gesek Indikasi):** Merupakan isyarat di *Desktop Pointing Device* pabila ujung panah menyentuh blok Jadwal Kosong/Kartu Lapangan; bingkisan kontainer terangkat satu jengkal ke atasan berkalibrasi mulus transisi geser mikro *(misal eksekusi tailwind `transform transition hover:-translate-y-1 hover:shadow-md duration-200`)*. Palet warna primer disiapkan mendistorsi menjadi nuansa setingkat lebih lekat *(Indigo-600 berselancar memadat ke Indigo-700)*.
- **Loading State (Manipulasi Pikiran Muatan Pangkalan):** Saat mesin *client* merangkak menembus server mengekstraksi parameter kalender tanggal *Booking* hari terlampir, ia menyamar wujud bukan jadi sekadar putih meruang kosong mematung, melaikan membubuhkan denyut animasi siluet balok kelabu berdetak ritmis (*Skeleton UI Loaders blur effect pulse*).
- **Error State (Gagal Eksekusi Rangsang Raba):** Bilamana pelamar lalai dan merapalkan kode masuk tak teridentifikasi otorisasi silang asupan atau mengunggah potret lebih dari kapabilitas (e.g., File 10MB masuk), seketika modul input meledak warna memerah pudar pada *border*, mengintrupsi kordinasi formasi dan menyelimuti letupan notifikasi pelampung pesak kecil kemerahan (*Toast Merah*).
- **Success Feedback (Induk Pernyataan Kelegaan):** Pasca tombol **Checkout** diketuk mantap dan *API Post Database* mengaminkannya utuh; pergeseran tombol mengekstraksi diri terganti oleh *icon vector Checkmark* (Centang Hijau Lottie/SVG), diikuti perpindahan pandang transisi kilat penyerahan bukti.

## 8. Responsiveness (Siklus Pelengkungan Sumbu Resolusi Ekosistem)
Manifestasikan jaminan formasi mutiara pelana tampilan tanpa memandang letak pijakannya (Bantuan tular kelas reka `md:` `lg:` `xl:`):

- **Mobile View (Perangkat Genggam Telepon) - _(Dasar < 768px)_ :**
  Rujukan dasar mutlak tanpa awalan komando media di Tailwind CSS. Blok antarmuka disemat satu atas yang lain memeluk rentang garis pinggir selebar 100% dari kolom dinding *Viewport* `(w-full)`. Balok pemilah *Time Slot* jam tertancap berbaris `grid-cols-2` maksimal 2 biji sebelahan atau 3 bilamana memuati ruang demi memberi kompromi ruan ibu jari (Mencegah ketersalahan klik ke jam yang berdekatan *Fat-finger accident*). Formasi menu atap dihibahkan tersisip laci tersembunyi (*Hamburger* sentuh geser). Navigasi fiksasi pesanan lengket ke tapak selayar (*Sticky bottom*), mendampingi pelanggan berputar layar tiada henti.
- **Tablet View (Pad Penampil Menengah) - _(md: 768px - 1024px)_ :**
  Kontainer tubuh melebarkan sumbu rentang membagi area menjadi dua sisi sebanding (Misal, *Booking Summary Cart* mulai berani dipamerkan bersampingan di sebelah matriks kalender penguncian hari tak lagi terjepit di selimut telapak). Matriks jadwal lapak lapangan diurakan `grid-cols-4` sampai `grid-cols-[auto-fit]`.
- **Desktop View (Pancaran Lebar Lapang Layar Horizontal) - _(lg: >1024px)_ :**
  Panel Administratur Manajemen menguasai pilar kekukuhan seutuhnya, Sidebar menu statis terbingkai memaku pondasi sisi kiri terus utuh bersiaga. Modul riwayat log pemesanan dan pengawas potret unggahan reka melar menguasai ruang horizontal di samping kanannya tanpa terjeda, mendongkrak visibilitas data berjajar tabel perbanyak belasan matriks dan detail kolom informasi super lapang bebas sempit, memaksimalkan navigasi inspeksi mata *scanning pattern*.

## 9. UX Flow (Sirkulasi Navigasi Berkelana Transaksional Bertahap)

### A. Konstelasi Skenario: User Booking Lapangan 
> _(Misi: Pelamar memilih dan memblokir jam di Hari Minggu ini)_
- **Tahap 1 | Aksis Interaksi Kalender (*Discovery*):** Dari pintu sambut ia berkelana mendatangi "/booking". Matanya terkunci di antarmuka rentetan pilihan horizontal hari. Jarinya memilih rupa tulisan tegak hari *"Sabtu, 20 Juli"*. Sistem mengais silang memantulkan blok lapangan dalam sepersekian detik.
- **Tahap 2 | Klaim Petak Lapangan (*Decision-making*):** Pelanggan mendeteksi sebuah blok pijakan jam ubin tersusun abu-abu bernafaskan label (*"19:00 Booked" - Terlarang*), ia menavigasi ke blok putih bersahaja di sudut sebelahnya *"20:00"*. Ia lekas mengeklik, petak itu mekar menyoroti warnanya menandakan klaim *(Active state)*.
- **Tahap 3 | Formasi Pengikatan Cepat (*Checkout Bridge*):** Menu pelekat dasar berdesis menampakkan deretan perhitungan agregasi ongkos konversi mutlak menyala: *Total Biaya Rp[X]*. Seketika menyenggol bilah tombol panjang *"Booking Sekarang & Amankan"* mendominasi.
- **Tahap 4 | Pendaratan Identitas Wajib (*Authentication Auth-Gate*):** *Middlewares Next.js* bekerja menghalang akses karena ketiadaan riwayat status masuk, maka pengguna memutar sementara mengisi 2 *Input Fields* (Surel dan Password Login) dan diluncurkan balik kilat pada posisi pemesanan sejenak tanpa disterilisasi data keranjangnya semula.
- **Tahap 5 | Konklusi Perjumpaan Kas Lampiran (*Attach Payment Final*):** Pangkalan data mencapnya *Pending*. Ditampilkan ringkasan gerbang konfirmasi Nomor Bank Administratur Lapangan besar. Pelanggan meninggalkan aplikasi seluler (Beralih ke platform Bank BCA/GoPay Mandiri dll), menjelek tangkapan seluler, tiba kembali dalam portal, menyulut tap pelatuk "Unggah Image/Kirim Dokumen", meramunya, sistem merotasinya, *Submit* konklusif ter-peluncur ke angkasa *Database Status Menunggu Pengesahan*. Tuntas di sisi kustomer *Front line*.

### B. Konstelasi Skenario: Admin Memburu Verifikasi
> _(Misi: Meneliti serahan resi pelanggan)_
- **Tahap 1 | Sinyal Asap Terdektesi (*Alert/Monitor*):** Operator membuka dasbor di perangkat Mac/PC nya pada fajar rute "/admin/dashboard", diserang pengumuman tebal persembahan bel alarm peringatan bertulis pada layar "*[1] Pemesanan Baru Menunggu Lampiran Verifikasimu*".
- **Tahap 2 | Investigasi (*Drill-Down Modal Overlay*):** Manajer meramban turun pada susunan riwayat baris tabel rekam perolehan tersebut, pada sel baris milik Tuan Fulan, di ujung sayap kanan diketukkah ikon perancangan mata "Cek Transaksi Lampiran". Bingkai pelindung kabut redup menahan tampilan aplikasi dan membuka pigura gambar *Preview Window Pop-up Modal* lebar bermuatan memori hasil rekam potret pelanggan di formasi pilar peladen `Uploads/Resi.png`.
- **Tahap 3 | Eksekusi Mandat Peradilan (*Final Action Judgment*):** Sesudah berselancar menengok jejak mutasi aliran modal di bank aslinya dengan nilai di gambar, Admin bergelut ke ranah kancing yang merekatan pigura bersangkutan dan mengklik sekuat-kuatnya warna biru/hijau primer bermutu **[SETUJUI - APPROVE]**.
- **Tahap 4 | Restrukturisasi Total Jeda Mutlak (*Closing Feedback Database*):** Modul tabel perolehan pesanan milik Fulan tervaluk mendadak tergerus musnah dari layar pemantauan "Yang Terabaikan / Menunggu Verifikasi." Sisi Peladen mentranslasikan peluruhan mutasi abadi pergeseran lencana dari *Verifying* mutlak menjadi lebur kepada pelantikan *Confirmed*. Petak tanggal itu ditelan utuh selamanya menyublim mutlak terisolasi dari seluruh akses klien web publik pada malam itu pabila dikunjungi. Arus sirkulasi berakhir sukses transaksional.

---
*(Lembar acuan panduan kompas estetika dan logistik antarmuka rekayasa antarmuka (Design UI/UX Blueprint) ini divalidasi presisi untuk dijahit kompilasi translasi komponennya murni lewat Next.js React App Router dan penumpukan ClassName di lintasan utilitas Tailwind CSS tanpa jeda kebingungan).*
