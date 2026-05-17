# Product Requirement Document (PRD): Padel Court Booking System

## 1. Ringkasan Produk
**Padel Court Booking System** adalah sebuah aplikasi web yang dirancang khusus untuk mendigitalisasi dan mengotomatisasi proses pemesanan lapangan olahraga Padel. Aplikasi ini memiliki tujuan utama menjadi platform interaktif *all-in-one* yang menghubungkan pelanggan dengan pengelola lapangan, memungkinkan pengecekan jadwal lapangan, proses *booking*, dan pembayaran menjadi lebih instan, terpusat, dan serba transparan. Secara keseluruhan, fungsi sistem ini mengatasi inefisiensi pengelolaan lapangan berbasis *messenger* konvensional dengan menghadirkan solusi teknologi mutakhir untuk memperlancar arus operasional penyewaan fasilitas olahraga.

## 2. Masalah yang Diselesaikan
Sistem ini secara mendasar menjadi solusi mutlak atas permasalahan operasional pada sistem lama berbasis konvensional/manual:
- **Pemesanan Manual dan Tidak Tersentralisasi:** Proses *booking* via obrolan WhatsApp atau layanan telepon cenderung lambat, selalu mengharuskan respons komunikasi dua arah antara staf fasilitas dengan para pemain, serta menghabiskan energi untuk menanyakan jadwal.
- **Risiko Pemesanan Ganda (*Double Booking*):** Kekhilafan (*human error*) dalam sinkronisasi jadwal pencatatan manual sering mengakibatkan dua kelompok atau lebih berhasil dipesan di lapangan yang sama pada jam bertabrakan.
- **Kurangnya Visibilitas Kalender:** Pelanggan tidak memegang pandangan *real-time* atau transparansi mengenai tanggal kapan saja yang sudah ludes dipesan atau lapangan apa saja yang sedang dalam status diperbaiki.
- **Pengelolaan Rekap File/Pembayaran Kacau:** Staf selalu dipusingkan dengan validasi berkeping-keping transfer bank, sulit diarsipkan ulang, berimbas membingungkan peninjauan rekap kas internal tiap tutup bulan.

Terang saja, sistem berbasis *database* akan bertindak seratus persen otomatis melarang transaksi yang bentrok dan merekap riwayat tagihan dengan akurat dalam satu antarmuka dasbor.

## 3. Target Pengguna
Aplikasi ini melayani dua jenis basis demografis pengguna yang dibagi atas:

### a. Pengguna Utama (Pelanggan / Pemain Padel)
- **Karakteristik:** Komunitas yang aktif bermain olahraga sosial ini (mayoritas berumur 18-50 tahun), memiliki ponsel pintar aktif (*Mobile friendly user*), familiar dengan teknologi pembelian e-niaga. Menginginkan alur pesanan serba otomatis.
- **Kebutuhan Utama:** Kemampuan secara proaktif mendaftar akun dalam hitungan detik, kemudahan memeriksa ketersediaan jam bermain minggu ini dan bulan depan, dan dapat melancarkan pesanan serta melaporkan mutasi bank kapanpun.

### b. Pengguna Internal (Admin / Pihak Pengelola Lapangan)
- **Karakteristik:** Supervisor atau pihak operasional peladen lapangan (*Duty Manager*). Terfokus mengawasi ketersediaan kalender harian, bertugas memverifikasi kelengkapan pendapatan.
- **Kebutuhan Utama:** Platform *Dasbor Web* terproteksi sandi di layar *Desktop* maupun tablet khusus admin untuk pengecekan notifikasi penyewa baru, menyortir daftar persetujuan, melihat lampiran foto resi pembayaran, dan melakukan moderasi validitas atau menolak penyewa fiktif.

## 4. Nilai Utama Produk
Nilai fungsional paling berarti dari pengembangan perangkat lunak ini diukur pada:
- **Otomatisasi Maksimal (*Automation*):** Seluruh proses tawar-menawar jadwal serta registrasi dipangkas bersih menjadi kemandirian transaksi pengguna 24/7.
- **Kemudahan Efisien (*Efficiency*):** Membendung lonjakan membanjirnya klien yang bertanya kosong/tidaknya jam pada staf. Memungkinkan pengguna tahu diri terhadap realitas penentuan jadwal.
- **Transparansi Sistematis (*Transparency*):** Presentasi grafis kalender membiarkan pelanggan berebut sisa porsi yang ada tanpa merugi atau mengklaim kecurangan, dan melihat transparansi tarif harga per blok jam sepenuhnya di depan layar tanpa ada tarif siluman.
- **Proteksi Tumpang Tindih (*Concurrency Protection*):** Integrasi ketat perihal *Record Locking* menyeleksi siapa yang paling awal menarik kursor *booking*.

## 5. Sasaran Produk
### Sasaran Rilis Saat Ini (Tahapan MVP)
Sasaran inti perilisan *Minimum Viable Product* ditekankan pada satu landasan penyelesaian siklus hidup esensial transaksi (*Core Flow*), bertumpu pada: Fungsi pendaftaran/login, penyajian antarmuka jadwal interaktif terkini, pengaplingan lapangan dengan rentang durasi di kalender aplikasi, modul kirim-unggah lampiran gambar pelunasan ke dasbor internal peladen, hingga berakhir di titik finalisasi otoritas manual admin dasbor.

### Bukan Fokus Saat Ini
- Pembuatan antarmuka produk berbasis aplikasi cerdas lokal/ *Mobile Native Application* semisal iOS (App Store) atau App Android (APK/PlayStore).
- Instalasi model Langganan Menawan (*Subscription/Tiered Loyalty Point*) pengguna setia.
- Fitur portal *Matchmaking* pencarian musuh bertanding publik, hingga tabel pemeringkatan juara turnamen.
- Sistem notifikasi pengingat via bot komersial komunikasi (*WhatsApp Business API/Push Notifications* otomatis peladen).
- Sambungan interaksi mutasi otomatis instan gerbang finansial (*Direct Automatic Payment Gateway Third/Middleware*).

## 6. Platform dan Posisi Produk
Merujuk pada parameter rekayasa *software*:
- **Platform:** Situs Aplikasi Web Terapan (*Web Application*).
- **Optimasi:** Menjunjung tinggi filosofi desain pendahuluan *Mobile-First/Mobile-Friendly*, karena pola kebiasaan pelanggan murni menggunakan ponsel pintar saat menentukan rencana pemesanan spontan.
- **Model Akses:** Autentikasi Pengamanan Tertutup. (Publik bisa memandangi jadwal lapangan, tetapi diwajibkan melewati tahap Registrasi kredensial untuk menjustifikasi reservasi bayar).
- **Arsitektur Pengembang:** 
  - Pondasi Inti & Backend: **Next.js 14+ (App Router, API Routes, Server Actions)**.
  - Lapisan Estetika Frontend: **React Framework** dipadupadankan kemasan utilitas terpadu antarmuka **Tailwind CSS** (menargetkan pendekatan ala Linear Design System yang *clean minimalist* jika memungkinkan).
  - Infrastruktur Data Konkuren: **PostgreSQL** ditenagai eksekutor *query* dari **Prisma ORM**.

## 7. Cakupan Fitur Saat Ini
Detail fitur pada perilisan perdana (*V1*) MVP terkompilasi sebagai berikut:

### 7.1 Autentikasi
- **Apa yang bisa dilakukan user:** Registrasi mandiri (*Sign Up*) lewat pos elektronik lokal, dan prosedur masuk kredensial (*Sign In/Log Out*).
- **Perilaku sistem:** Proses dipagari utuh peladen autentikasi kuki/sesi bawaan dari **NextAuth / Auth.js** dengan menyimpan enkripsi valid *Hash Password* (*Bcrypt*) pada PostgreSQL, melindungi rute-rute *Protected Pages*.

### 7.2 Informasi Lapangan
- **Apa yang bisa dilakukan user:** Membuka laman keterangan dan harga penyewaan standar satu lapangan Padel, lengkap deskripsi singkat fasilitas penunjang.
- **Perilaku sistem:** Melakukan inisialisasi basis data `courts` dengan memaparkan properti entitas tersebut lewat gaya responsif modern.

### 7.3 Sistem Jadwal
- **Apa yang bisa dilakukan user:** Berselancar mengakses pendaratan penanggalan, menggeser bulan, memeriksa setiap hari terhadap parameter balok jam-jam kosong bernilai waktu aktif (1-jam/sesi).
- **Perilaku sistem:** Secara periodik menyajikan muatan baris tabel sesi waktu. Menetralkan interaksi seleksi (*Disabled click* & Merah pekat visual) bagi semua petak waktu lapangan yang statusnya di luar batas jangkau atau telah berpredikat *Booked* milik klien orang lain.

### 7.4 Booking Lapangan
- **Apa yang bisa dilakukan user:** Memilih spesifik deretan petak jam *available*, mencerna ringkasan layar tarif uang pemesanan tagihan total, lalu meluncurkan mandat *Checkout*.
- **Perilaku sistem:** Melakukan persidangan pemeriksaan lapis dua peladen (*Server-side Validation & Concurrency*), dan sesegera mungkin merekrut pesanan itu menduduki pangkalan data bereferensi `Status: Pending`.

### 7.5 Pembayaran (MVP)
- **Apa yang bisa dilakukan user:** Menerima detail nomer penampungan rekening bank manajemen dari sistem, lalu wajib mengunggah/meng-*upload* lampiran foto resi/resi elektroniknya untuk mensubmit bukti mutasi konklusif di aplikasi.
- **Perilaku sistem:** Menyimpan tangkapan foto transaksi tersebut ke dalam modul peletakan peladen bawaan (`uploads`), menguatkan persetujuan relasi pembayaran sistem pesanan, mengerek mutasi label dari *Pending* -> *Waiting Approval*.

### 7.6 Dashboard Admin
- **Apa yang disajikan untuk user (Internal/Admin):** Portal khusus bagi pengurus menyortir rekam mutasi data; melihat sekumpulan klien mereservasi hari esok; membuka/menampilkan potret resolusi resi bayar untuk klarifikasi penarikan uang dari akun bank sesungguhnya. Menindak lanjuti penolakan *Reject* (bila tidak valid/palsu) serta menekan pemicu ketuk *Approve* mutlak.
- **Perilaku sistem:** Menyegel kuat-kuat peladen khusus peran "*ADMIN*". Rekonstruksi basis data mengunci mutlak kalender pasca tindakan klik 'Approve' dengan rekam permanen bertema `Status: Confirmed/Paid`.

## 8. Alur Pengguna Utama
Pengalaman interaksi diutamakan sedemikian kronologis dengan *step-by-step*:

### a. Alur Booking oleh User (Front-end)
1. **Langkah 1:** Pelanggan bermuara di layar Halaman Utama Web melihat Daftar Fasilitas visual Padel.
2. **Langkah 2:** Menekan aksi "Cek Jadwal," lalu memilih parameter kalender tanggal presisi, misal "25 Mei". 
3. **Langkah 3:** Bermunculan balok jam waktu lapangan berderet. Pelanggan mengeklik satu/beberapa slot jam yang memancarkan status hijau (*Available/Kosong*).
4. **Langkah 4:** Saat melangkah, bila masih di luar kuki/Sesi, sistem mencegat sementara memaksanya melangsungkan pendaftaran identitas (Singkat).
5. **Langkah 5:** Ditelaah ke layar konfirmasi pembiayaan, sistem menyajikan Ringkasan Akhir. Menekan "Lanjut Pemesanan".
6. **Langkah 6:** Pengguna beralih menunaikan transfer luar dari M-Banking di perangkat ponsel miliknya, ia kemudian melakukan unggah serahan *file* foto fakturnya, klik "Kirim Pembayaran".
7. **Langkah 7:** Sistem menerima dan melabeli pesanan tersebut menunggu verifikasi manajemen lapangan. Selesai di sisi pengguna.

### b. Alur Verifikasi oleh Admin (Back-office)
1. **Langkah 1:** Staf Admin Padel datang berselancar menuju Web portal khusus. Ia masuk dengan kunci administrator hak tinggi.
2. **Langkah 2:** Pada bilah tampilan menu Dasbor, administrator menavigasi ke deretan notifikasi tebal *"Waiting for Approvals / Menunggu Verifikasi"*.
3. **Langkah 3:** Mengetuk interaksi pesanan milik klien terpilih, admin akan meninjau visibilitas cetak layar bukti transfer dan memadankan saldo tabungan di akun giro bank komersial perusahaan real.
4. **Langkah 4:** *Validasi:* Apabila uang sah telah meresap sukses, administrator melepas tombol ketuk "**Approve/Konfirmasi**". Jikalau bohong/tidak valid tanpa uang, direalisasikan klik "**Reject**".
5. **Langkah 5:** Sistem dengan kaku mengikat mutasi basis data mengubah petak kalender jadwal klien itu seketika permanen (*Booked* - Mutlak terekam) dan siap diagendakan presensi pada saatnya tiba di lapangan Padel.

## 9. Alur Proses Pengembangan Sistem
Etape arsitektural proyek merangkum perjalanan tahapan yang sistematis:
1. **Perencanaan (*Planning*):** Pelibatan pendefinisian mutlak produk PRD ini guna mengakurasi target wujud nyata aplikasi MVP tanpa penambahan sub-fitur irasional (*Scope creeps*).
2. **Perancangan (*Design & ERD*):** Melakukan eksekusi rekayasa antarmuka sketsa visual presisi layar (*Figma/Wireframes*) dan pembuatan topologi bagan relasi antar Tabel pangkalan peladen (*Entity Relationship Design*).
3. **Frontend Construction:** Menubuhkan blok pembentuk desain reaktif dari Tailwind, mentranslasikan ide antarmuka logis terhadap deretan Kerangka kerja navigasi Next.js komponen.
4. **Backend/Server Configuration:** Pembangunan kokoh fondasi API rute CRUD fungsional, peletakan penempatan prisma struktur tabel pada SQL, dan pengecatan fungsi NextAuth perlindungan gerbang masuk.
5. **Integrasi Logika Eksekusi:** Menyatupadukan parameter jembatan (*Endpoints Hooking*), ketika kalender UI bertemu pangkalan pemesanan API untuk pertukaran rekayasa sinyal waktu nyata dan unggahan direktori foto dokumen resi faktur lokal.
6. **Validasi Pengujian (*Extensive Testing*):** Mensimulasikan pengerumunan pesanan secara sengaja (Testing *Concurrency/Stress limits* & Celah ganda tabrak jadwal) untuk meyakini kebal *Double Booking* 100%, beserta pengujian lintasan skenario tata letak ponsel beresolusi super tipis.

## 10. Kebutuhan Fungsional
Fungsi wajib perangkat ini mendikte skenario implementasi kaku ini dipenuhi:
- Registrasi otorisasi mewajibkan pelamar menambatkan nama sah, surel aktif, komutasi *password*.
- Sistem WAJIB mendukung fungsi kelumpuhan elemen interaktif ("*Disabled Pointer*") pabila jam kalender sudah habis di*booking* pengikat lain atas peladen. 
- Harus terdapat kanal pangkalan riwayat portofolio interaksi bagi para pengguna ("Riwayat *Booking*ku").
- Fungsionalitas memori pengolah berkas serapan terbatas murni menyaring/ekstensi parameter penangkapan Gambar Mutlak `[JPG / PNG / JPEG]` pada lampiran transfer.
- Wajib memiliki panel eksklusivitas fungsionalitas manajemen *Admin Dashboard* demi manipulasi tabel ringkasan pelanggan.

## 11. Kebutuhan Non-Fungsional
Tolok ukur jaminan kesuksesan perangkat lunak di luar spesifikasi fungsional fitur:
- **Performa Responsivitas Jaringan:** Laman web saat me-*render* antarmuka ketersediaan kalender mutlak menampakkan angka rata ping peladen dengan latensi maksimal `~ 1000ms`, menjaga navigasi *Load State* halaman tidak menimbulkan friksi putus asa menunggu (*Toleransi minimal First Contentful Paint*).
- **Keamanan Siber (*Security Protocols*):** Kompresi tingkat enkripsi sandi bertubi-tubi algoritme sejenis *Bcrypt* *salt* dan penyegelan manipulasi API *State*/pintas akses untuk admin (*NextAuth Middlewares Guards*).
- **Responsiveness Geometri UI:** Tidak mentoleransi pendaratan antarmuka yang rusak/meluber secara vertikal saat ditekan layar piranti seluler *mobile* di minimal rentang kanvas pandang rasio ~ 360-400px.

## 12. Model Data Produk
Skema Data Induk dirancang menggunakan hierarki entitas pada skema prisma SQL berikut:

- Entitas Penampung Pusat **`users`**
  - **Fungsi:** Pelanggan / Pengelola berinteraksi masuk sistem.
  - **Atribut Relasional:** `id(PK)`, `name`, `email(Unik)`, `password_hash`, `role(Enum: USER | ADMIN)`, `created_at`, `updated_at`
- Entitas Unit **`courts`**
  - **Fungsi:** Inventaris nama-nama lapangan serta tarif sewa dasarnya.
  - **Atribut Relasional:** `id(PK)`, `name`, `description`, `hourly_price`, `is_active(boolean)`, `created_at`
- Entitas Operasional **`bookings`**
  - **Fungsi:** Perajut kronologis interaksi yang menargetkan pemain terhadap lapangan beserta batas sesi spesifik harinya.
  - **Atribut Relasional:** `id(PK)`, `user_id(FK)`, `court_id(FK)`, `date`, `start_time`, `end_time`, `total_price`, `status(Enum: PENDING | WAITING_APPROVAL | CONFIRMED | CANCELLED)`, `created_at`
- Entitas Bukti Pembayaran **`payments`**
  - **Fungsi:** Faktur arsip potret resolusi keuangan untuk pesanan.
  - **Atribut Relasional:** `id(PK)`, `booking_id(FK)`, `amount`, `receipt_url`, `status(Enum: UNVERIFIED | VERIFIED | REJECTED)`, `created_at`

*Peta Relasional Kerapatan Database:*
- Sebuah Akun `users` diotorisasi meluncurkan penciptaan banyak *(1 - to - Many)* antrean histori `bookings` miliknya.
- Arena `courts` melekat abadi berkorelasikan jadwal reservasi ragam kumpulan `bookings` historis.
- Antrean rekab fisik reservasi eksklusif (`bookings`) memiliki hubungan soliditas berkas foto *(1 - to - 1)* terikat tunggal dengan pencatatan pembayaran `payments`.

## 13. API Produk Saat Ini
*Endpoint* krusial yang didefinisikan demi keberlangsungan arus data klien-server (API berbasis API Routes spesifikasi Next.js):
- `POST /api/auth/register` : Peladen integrasi NextAuth mendaftarkan muatan akun.
- `POST /api/auth/login` : Menuju siklus autentikasi penyamaran gerbang utama otoritas sandi.
- `GET /api/courts` : Menyebarkan parameter pangkalan lapangan pada sistem muatan pendaratan halaman fasilitas.
- `GET /api/bookings?date=YYYY-MM-DD` : Rutin menarik rentetan catatan basis jadwal dari irisan hari absolut ini (mengendalikan kalender *real-time* dan memilah balok jadwal yang ludes dipesan vs. kosong).
- `POST /api/bookings` : Menembakkan persetujuan melancarkan pesanan dengan blok sistem pangkalan memastikan irisan ketersediaan parameter yang terjalin (*Strict Transaction Logic*/Kunci *SQL Concurrency* mencegah tabrakan interaksi sedetik).
- `POST /api/bookings/[id]/pay` : Menugaskan *body formData* berisi dokumen bukti *Upload File*, mengeksekusi parameter pengiriman merubah pesanan ke zona *Verifikasi*.
- `PATCH /api/admin/bookings/[id]` : Eksklusif otoritas *Token Middleware* Admin untuk mengeksekusi nasib status mutlak `status= CONFIRMED/CANCELLED` atas jadwal lapangan bersangkutan secara final.

## 14. Batasan Produk Saat Ini
Kesadaran terkait perimeter operasi fitur MVP yang tertahan/belum tertutupi sementara:
- Batas maksimal bentangan jadwal tidak merespons kalender pemesanan melebihi bulan di atas kapasitas waktu operasional misal **30-60 Hari kedepan** (*Preventif penumpukan data spam di masa jauh kosong*).
- Ketidakberdayaan klien menekan rute pemesanan berdurasi paruh sentimeter menit (Terkunci pada minimum satu iterasi blok interaksi komutatif genap/seutuhnya, **Durasi sewa kelipatan bulatan blok 1 Jam** atau 2 jam mutlak).
- Kewajiban total keterlibatan penumpu kuasa manajemen (*Manual Admin Verification bottleneck*) saat mendulang konfirmasi karena keabsenan parameter interaksi dompet bank eksternal otomatis. 
- Perubahan parameter penarikan pesanan gagal / batal/ Modifikasi Jam geser dadakan tidak disediakan di antarmuka publik, sehingga pelanggan yang berencana urung hadir sepenuhnya harus menemui saluran WhatsApp komando untuk meminta penghapusan dari tim operasional di *Background Server*.

## 15. Risiko Produk
- **Pelunturan Waktu Verifikasi Administrasi (*Late Validation Bottleneck*):** Lambannya kinerja administratur mengeklk "Setuju" ketika di malam hari atau hari padat pesanan pelanggan. Menginduksi kegelisahan klien saat ia tidak meraup surat kepastian pelunasan kalender pada *dashboard* mereka dengan cepat.
- **Rentan terhadap Sabotase File/Eksploitasi Dokumen Unggah:** Kenakalan segelintir entitas menyematkan gambar abal (tidak faktual) memperlelah tenaga kerja filter manual manajemen. Begitu pula eksploitasi parameter dokumen ukuran raksasa/malware mengelabui direktori unggahan peladen rentan mencederai *Hosting storage space* jikalau batas aman limit filter tidak terprogram di form.
- **Problem Tabrakan Jeda Peladen (*Concurrency Double-Booking latency*):** Walau probabilitas kecil akibat asinkronisasi koneksi milidetik di lingkungan awan (*Cloud*), tetap terdapat risiko latensi peladen gagal menumpukan mitigasi transaksi Prisma, namun strategi kontrol konkurensi SQL diharapkan menjadi pertahanan memumpuni isu ini seratus persen.

## 16. Prioritas Pengembangan Berikutnya
Agenda visi perluasan fungsionalitas peta operasional jalan di *Phase 2 V2* menargetkan:
1. **Otomatisasi Gerbang Penagihan E-Payment (*Payment Gateway Intergration*):** Integrasi platform instan model *Midtrans* atau *Xendit* membuang jauh alur pengecekan admin ke keranjang sampah, mentransformasi status *booking* dalam siklus ~ 2 detik QRIS valid masuk tuntas. Tersebutlah *Zero friction transaction*.
2. **Mesin Pemancar Notifikasi (*Automated API Bot Messengers*):** Pengikatan Bot *WhatsApp Gateway* (Fonnte/Watzap) menembakkan bukti faktur pesanan terkonfirmasi, ditambah notifikasi pengingat H-2 Jam sesi permainan secara proaktif.
3. **Ekosistem Penyesuaian Sendiri (*Client Self-Reschedule / Cancellation System*):** Pembangunan Portal pembatalan sendiri oleh para punggawa hingga rentetan toleransi satu hari sebelum jam dimulai, lalu menumbuhkan rekosistem *Refund / Credit Balance Wallet* lokal mutakhir terintegrasi penuh.

## 17. Definisi Sukses
Indikasi tolok ukur kesempurnaan proyek dan kepuasan teknis rilis produk:
1. **Adopsi Sukarela Optimal ( *Utilization Volume* ):** Mengungguli di atas presentase partisipatif 80% pelanggan konstan beralih melakukan pendaftaran tuntas dan perapalan jadwal murni melalui domain web aplikasi dengan inisiatif sendiri, bukan menelepon staf pada jam reguler bisnis sebulan pasca diluncurkan.
2. **Kehancuran Nol untuk Insiden Tabrakan (*Zero "Double Booking" Incident Rate*):** Meraih titik kebersihan penuh akan keberlangsungan tabrakan jam pemesanan bersamaan dalam database rekam di ranah peladen nyata (*Production*).
3. **Persistensi Ringanan Beban Kerja Staf (*Admin Workload Efficiency*):** Kumpulan staf manajemen takkan lagi menyentuh pencatatan waktu lembar Excel atau agenda buku, waktu pengerjaan alur penerimaan hanya <15% terbuang guna menyegarkan Dasbor Web Admin Verifikasi belaka, jauh memperlincah waktu eksekusi.
4. **Kepuasan Metrik Kecepatan (*Velocity Booking Rate*):** Navigasi antarmuka klien bisa mendaratkan sebuah mutasi pesanan utuh ke bank dalam rekor pelayaran kurun durasi < 1,5 hingga 2 menit dari gerbang login.

## 18. Ringkasan Status
Sistem Perancangan Arsitektur Dokumen **Padel Court Booking System** dideklarasikan menapakkan jejak kuat pada tahapan status formasi strategis **MVP (Minimum Viable Product)**. Perangkat lunak ini tidak mengejar kilap elemen mewah (*Nice-to-have features*), melainkan bertumpu secara logis mengganti kekacauan reservasi serba lisan WhatsApp dengan gerbang gerak otomatis mandiri berkekuatan mutlak. Aplikasi ini sangat menjanjikan kesolidan manajemen rekam alur waktu lapangan eksklusif dan keamanan terenkripsi mutlak dengan bertumpu teguh pada eksekusi kode *NextJS* Full Stack dan presisi database Prisma yang segera dipersiapkan masuk meja pemrograman/coding.

---
*(Dokumen ini merupakan artefak sentral terstruktur tinggi sebagai landasan arsitektural mutlak yang akan dipedomani sepenuhnya selaras pembangunan proyek hingga waktu implementasi sesungguhnya).*
