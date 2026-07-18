# DOKUMEN ACUAN (KNOWLEDGE BASE / GROUNDING DOCUMENT) UNTUK AI AGENT
## Proyek: Aplikasi Helpdesk IT UNDIP Berbasis WhatsApp

| Metadata | Isi |
|---|---|
| Jenis dokumen | Reference / grounding document — dipakai AI agent sebagai sumber kebenaran (source of truth) sebelum & sesudah mengerjakan tugas terkait proyek ini |
| Disusun dari | *Proposal Pembuatan Aplikasi Helpdesk IT* — Subbagian Teknologi Informasi dan Web, Direktorat Sistem dan Teknologi Informasi, Universitas Diponegoro |
| Versi dokumen acuan ini | 1.0 |
| Tanggal disusun | 16 Juli 2026 |
| Tanggal proposal sumber | 15 Juni 2026 |
| Cakupan | Seluruh isi proposal (Lembar Pengesahan s.d. Lampiran 2) dituliskan ulang secara terstruktur, diberi ID, tanpa menghilangkan satu pun ketentuan/angka/istilah dari dokumen asli |

```json
{
  "project_id": "HELPDESK-IT-UNDIP-WA",
  "project_name": "Aplikasi Helpdesk IT Universitas Diponegoro Berbasis WhatsApp",
  "pengusul": "Subbagian Teknologi Informasi dan Web, Direktorat Sistem dan Teknologi Informasi UNDIP",
  "ketua_tim": "Wina Ratna Wati, S.Kom., M.Kom",
  "penanggung_jawab": "Dr. Aris Puji Widodo, S.Si., M.T. (Direktur Sistem dan Teknologi Informasi)",
  "durasi_pelaksanaan": "3 bulan (lihat catatan ambiguitas Bagian 29)",
  "perkiraan_anggaran_lembar_pengesahan": "Rp30.000.000",
  "total_rab_bab_vi": "Rp54.000.000 (tidak konsisten dengan rincian item, lihat Bagian 24 & 29)",
  "roles": ["PELAPOR", "OPERATOR_HELPDESK", "TEKNISI", "ADMINISTRATOR", "PIMPINAN"],
  "status_tiket": ["Open", "Diproses", "Selesai/Close", "Ditolak/Dibatalkan", "Dibuka Kembali/Reopen"],
  "prioritas": ["Kritis", "Tinggi", "Sedang", "Rendah"],
  "kanal_pelapor": "WhatsApp (WhatsApp Business API / gateway resmi)",
  "kanal_petugas": "Dashboard web internal",
  "tech_stack_kandidat": {
    "frontend": ["React", "Vue.js"],
    "backend": ["Node.js/Express.js", "Laravel"],
    "database": ["PostgreSQL", "MySQL"],
    "webserver": ["Nginx", "Apache"],
    "deployment": "Docker (opsional), server internal atau cloud yang disetujui"
  },
  "document_status": "belum ditandatangani secara fisik/digital pada berkas sumber yang diterima"
}
```

---

## 0. CARA PAKAI DOKUMEN INI (WAJIB DIBACA OLEH AI AGENT)

Dokumen ini adalah **acuan tunggal (single source of truth)** untuk segala tugas yang berkaitan dengan proyek "Aplikasi Helpdesk IT UNDIP Berbasis WhatsApp". Setiap kali AI agent diberi instruksi/tugas yang menyentuh proyek ini (menulis kode, membuat desain, membuat copy pesan WhatsApp, membuat laporan, menjawab pertanyaan pengguna, dsb), agent **wajib**:

1. **Cari bagian yang relevan** di dokumen ini menggunakan ID (contoh: `[FR-02]`, `[ROLE-TEKNISI]`, `[SLA-KRITIS]`, `[CAT-1]`) sebelum mulai bekerja.
2. **Cek kesesuaian ruang lingkup** — apakah tugas yang diminta termasuk dalam Bagian 8 (Ruang Lingkup)? Jika di luar lingkup, tandai dan tanyakan konfirmasi ke manusia, jangan diam-diam memperluas cakupan.
3. **Cek kesesuaian peran & hak akses** terhadap Bagian 9 (RBAC) sebelum menentukan siapa yang boleh melihat/melakukan apa.
4. **Cek kesesuaian istilah** — status tiket, kategori layanan, level prioritas, dan nama menu **harus** memakai istilah persis seperti di Bagian 11, 14, dan 13 (jangan membuat istilah baru sendiri).
5. **Cek kesesuaian SLA** terhadap Bagian 15 setiap kali membahas waktu respons/penyelesaian.
6. **Cek Bagian 20 (Keamanan)** untuk setiap fitur yang menyentuh data pribadi, autentikasi, atau lampiran.
7. **Jika menemukan bagian abu-abu/ambigu**, rujuk Bagian 29 (Catatan & Anomali Sumber) — jangan menebak sendiri, laporkan ke manusia.
8. **Gunakan Bagian 30 (Checklist Kepatuhan)** sebagai self-review sebelum menyerahkan hasil kerja apa pun.
9. **Patuhi Bagian 31 (Aturan Tegas/Guardrails)** — ini batasan keras yang tidak boleh dilanggar apa pun alasannya.

Setiap butir persyaratan diberi kode ID (mis. `FR-05`, `SEC-03`) agar dapat dikutip langsung saat AI agent menjelaskan alasan suatu keputusan atau saat melakukan audit kepatuhan output terhadap proposal.

### 0.1 Ringkasan Cepat (Quick Reference)

| Elemen | Ringkasan |
|---|---|
| Tujuan proyek | Menyatukan pelaporan & penanganan kendala IT UNDIP dalam satu aplikasi helpdesk berbasis WhatsApp (sisi pelapor) + dashboard web (sisi petugas) |
| Kanal pelapor | WhatsApp resmi (scan barcode → auto terhubung) |
| Kanal petugas | Dashboard web, 4 peran: Operator Helpdesk, Teknisi, Administrator, Pimpinan |
| Inti sistem | Tiket otomatis, verifikasi, disposisi, SLA, notifikasi, basis pengetahuan, survei kepuasan, laporan/dashboard |
| Durasi | 3 bulan (lihat Bagian 29 untuk catatan ambiguitas) |
| Anggaran | Rp30.000.000 (Lembar Pengesahan) — namun BAB VI mencantumkan Total Rp54.000.000, lihat Bagian 24 & 29 |

---

## 1. IDENTITAS & METADATA PROYEK `[PRJ]`

| Komponen | Keterangan |
|---|---|
| Nama Kegiatan | Pembuatan Aplikasi Helpdesk IT |
| Unit Pengusul | Teknologi Informasi dan Web |
| Lokasi Pelaksanaan | Universitas Diponegoro, Semarang |
| Ketua Tim | Wina Ratna Wati |
| Durasi Pelaksanaan | 3 bulan |
| Perkiraan Anggaran | Rp30.000.000,00 |
| Tahun Pelaksanaan | 2026 |
| Mengetahui | Dr. Aris Puji Widodo, S.Si., M.T. — Direktur Sistem dan Teknologi Informasi, NIP. 197404011999031002 |
| Ketua Tim Pelaksana | Wina Ratna Wati, S.Kom., M.Kom, NIP. 198501142010122004 |
| Tempat, tanggal pengesahan | Semarang, 15 Juni 2026 |

---

## 2. RINGKASAN EKSEKUTIF `[SUMMARY]`

Pelayanan teknologi informasi di UNDIP mencakup empat area: dukungan jaringan/server, perangkat lunak/aplikasi, teknologi informasi & website, serta cyber security. Pelapor dapat berasal dari civitas akademika (mahasiswa, tenaga pendidik, tenaga kependidikan), alumni, maupun masyarakat yang membutuhkan penanganan cepat dan terdokumentasi.

Aplikasi Helpdesk IT diusulkan sebagai pusat pencatatan dan pemantauan bantuan teknis, dengan fitur inti: pengajuan & pelacakan tiket, verifikasi oleh operator helpdesk, batas waktu layanan (SLA), notifikasi, bukti penanganan, basis pengetahuan, survei kepuasan, laporan, serta dashboard berbeda untuk pelapor, administrator, dan pimpinan.

Dashboard menampilkan ringkasan tiket berdasarkan status, prioritas, kategori layanan, kinerja petugas, dan pencapaian SLA. Pengembangan direncanakan melalui tahap: analisis kebutuhan → perancangan → pengembangan → pengujian → implementasi → pelatihan → pemeliharaan awal. **Ruang lingkup akhir tetap dapat disesuaikan** dengan kebijakan keamanan, infrastruktur, dan tata kelola teknologi informasi UNDIP — klausul fleksibilitas ini penting dan harus selalu diperhitungkan AI agent saat mengevaluasi kepatuhan (lihat Bagian 8).

---

## 3. LATAR BELAKANG `[BACKGROUND]`

Teknologi informasi mendukung kegiatan akademik, administrasi, penelitian, pengabdian kepada masyarakat, kepegawaian, persuratan, pengelolaan data, komunikasi, serta koordinasi antarunit di UNDIP. Keberlangsungan jaringan/server, perangkat lunak/aplikasi, TI & website, cyber security, dan sistem informasi universitas membutuhkan dukungan teknis yang responsif dan terkoordinasi.

Kondisi saat ini: laporan kendala masih disampaikan melalui pesan pribadi, telepon, grup komunikasi, atau langsung ke petugas. Cara ini berisiko menyebabkan:
- laporan tidak tercatat,
- duplikasi penanganan,
- kesulitan menentukan prioritas,
- tidak tersedianya riwayat penyelesaian yang dapat dipantau pelapor maupun pimpinan.

Aplikasi Helpdesk IT diperlukan untuk menyatukan proses **pengajuan → verifikasi → penanganan → pemantauan → evaluasi** layanan dalam satu sistem. Setiap laporan memiliki: kode tiket, asal fakultas/unit kerja, kategori, prioritas, status, petugas, target waktu, riwayat komunikasi, lampiran, dan hasil penyelesaian.

Tujuan akhirnya: membentuk **satu kanal bantuan teknis resmi** yang transparan, akuntabel, mudah digunakan, dan mampu menyediakan data kinerja layanan bagi pengambilan keputusan.

---

## 4. IDENTIFIKASI PERMASALAHAN `[PROB]`

| ID | Masalah |
|---|---|
| PROB-01 | Pelaporan gangguan dan permintaan layanan (aplikasi, email, WA) belum terpusat dalam satu aplikasi. |
| PROB-02 | Laporan yang disampaikan melalui chat WhatsApp dan email tidak terekap secara otomatis. |
| PROB-03 | *(lihat catatan)* "Menyediakan nomor tiket otomatis dan mekanisme pelacakan status melalui chat WhatsApp." |
| PROB-04 | Tidak ada input periode pada cetak laporan — hanya bisa menggunakan pilihan yang tersedia pada aplikasi. |
| PROB-05 | Aplikasi Helpdesk IT yang lama tidak dapat dikembangkan lagi, baik dari sisi sistem operasi maupun fitur dan database-nya. |

> **Catatan untuk AI agent:** PROB-03 pada dokumen sumber ditulis dalam bentuk kalimat solusi ("menyediakan..."), bukan kalimat masalah seperti butir lainnya. Ini kemungkinan besar salah ketik pada proposal asli. Perlakukan PROB-03 sebagai *kebutuhan/fitur* (paralel dengan GOAL-02 di Bagian 5), bukan sebagai deskripsi masalah — lihat juga Bagian 29.

---

## 5. MAKSUD DAN TUJUAN `[GOAL]`

Maksud kegiatan: menyediakan aplikasi terintegrasi untuk mengelola bantuan dan penanganan kendala teknologi informasi di lingkungan UNDIP beserta seluruh unit kerja terkait.

| ID | Tujuan |
|---|---|
| GOAL-01 | Menyediakan media pelaporan gangguan dan permintaan layanan IT secara terpusat. |
| GOAL-02 | Menyediakan nomor tiket otomatis dan mekanisme pelacakan status *by chat* WhatsApp. |
| GOAL-03 | Mendukung verifikasi dan penugasan tiket berdasarkan kategori, asal fakultas/unit kerja, prioritas, kompetensi teknisi, dan beban kerja. |
| GOAL-04 | Mengukur waktu respons dan waktu penyelesaian melalui SLA. |
| GOAL-05 | Menyediakan dashboard operasional dan dashboard pimpinan yang menggambarkan kondisi layanan secara cepat. |
| GOAL-06 | Meningkatkan transparansi, akuntabilitas, dan kepuasan pengguna. |

---

## 6. MANFAAT PER PIHAK `[BENEFIT]`

| Pihak | Manfaat Utama |
|---|---|
| Pelapor (civitas akademika, alumni, masyarakat) | Mengajukan bantuan melalui satu kanal, memperoleh kode tiket, memantau status, menerima notifikasi, dan menilai hasil layanan. |
| Operator Helpdesk | Memverifikasi laporan, mengoreksi kategori dan prioritas, menjawab kendala, melakukan disposisi, serta memastikan tiket tidak terlewat. |
| Teknisi | Menerima daftar pekerjaan terstruktur, melihat tenggat SLA, mencatat diagnosis, tindakan, lampiran bukti, dan hasil penyelesaian. |
| Administrator | Mengelola pengguna, fakultas/unit asal, kategori aplikasi, petugas, SLA, notifikasi, hak akses, dan konfigurasi sistem. |
| Pimpinan | Memantau volume tiket, pencapaian SLA, tren gangguan, beban petugas, unit yang sering mengalami kendala, dan kepuasan pengguna. |

---

## 7. SASARAN PENGGUNA `[TARGET_USER]`

Dosen, tenaga kependidikan, mahasiswa, alumni, serta pimpinan Universitas Diponegoro.

---

## 8. RUANG LINGKUP PROYEK `[SCOPE]`

| ID | Cakupan |
|---|---|
| SCOPE-01 | Analisis kebutuhan dan proses bisnis bantuan IT pada rektorat, fakultas, sekolah, direktorat, lembaga, UPT, program studi, dan unit kerja terkait. |
| SCOPE-02 | Perancangan antarmuka, basis data, arsitektur, dan keamanan aplikasi. |
| SCOPE-03 | Pengembangan aplikasi web responsif untuk pelapor, operator helpdesk, teknisi, administrator, dan pimpinan. |
| SCOPE-04 | Pengembangan modul: pengajuan & tracking tiket, verifikasi, disposisi, SLA, notifikasi, dashboard, laporan, basis pengetahuan, survei kepuasan, dan audit log. |
| SCOPE-05 | Pengujian fungsional, keamanan, kinerja, serta User Acceptance Testing (UAT). |
| SCOPE-06 | Implementasi pada server, konfigurasi domain dan HTTPS, dokumentasi, pelatihan, dan pemeliharaan awal. |

> **Klausul fleksibilitas (penting):** *"Ruang lingkup akhir tetap disesuaikan dengan kebijakan keamanan, infrastruktur, dan tata kelola teknologi informasi Universitas Diponegoro."* Artinya SCOPE-01 s.d. SCOPE-06 adalah baseline, bukan batas kaku — perubahan tetap harus melalui persetujuan tata kelola TI UNDIP, bukan diputuskan sepihak oleh AI agent.

---

## 9. PEMANGKU KEPENTINGAN & HAK AKSES (RBAC) `[ROLE]`

| ID Peran | Peran | Hak Akses Utama |
|---|---|---|
| `ROLE-PELAPOR` | Pelapor | Membuat tiket, memilih asal fakultas/unit kerja dan kategori, mengunggah lampiran, melihat riwayat tiket sendiri, menanggapi pertanyaan teknisi, mengonfirmasi penyelesaian, dan memberi penilaian. |
| `ROLE-OPERATOR` | Operator Helpdesk / Verifikator | Melihat tiket masuk, memverifikasi kelengkapan, mengubah kategori dan prioritas, menolak laporan tidak valid, melakukan disposisi, dan memantau tiket yang belum ditangani. |
| `ROLE-TEKNISI` | Teknisi | Melihat tiket yang ditugaskan, menerima atau mengeskalasi pekerjaan, memperbarui status, mencatat diagnosis dan tindakan, meminta informasi, mengunggah bukti, dan menyelesaikan tiket. |
| `ROLE-ADMIN` | Administrator | Mengelola pengguna, fakultas/unit kerja, kategori layanan dan sistem, teknisi, SLA, hak akses, notifikasi, master data, audit log, dan seluruh tiket. |
| `ROLE-PIMPINAN` | Supervisor / Pimpinan | Memantau dashboard, pencapaian SLA, backlog, tren kendala, beban petugas, distribusi fakultas/unit asal, hasil survei, dan laporan periodik. |

**Aturan agent:** setiap fitur/tampilan yang dirancang harus dipetakan ke minimal satu `ROLE-*` di atas. Jangan memberi hak akses (mis. mengubah SLA, melihat seluruh tiket) ke peran yang tidak memilikinya secara eksplisit di tabel ini.

---

## 10. ALUR PROSES LAYANAN END-TO-END `[FLOW]`

| ID | Langkah |
|---|---|
| FLOW-01 | Pelapor masuk dengan men-*scan* barcode helpdesk IT dan otomatis terhubung ke WhatsApp Helpdesk IT. |
| FLOW-02 | Pelapor memilih kategori layanan dari *auto-reply* chat WhatsApp Helpdesk, mengisi data diri (nama, status), dan kendala yang dialami. |
| FLOW-03 | Sistem menghasilkan kode tiket otomatis, mengirim chat WhatsApp konfirmasi ke pelapor, dan mengirim notifikasi ke dashboard operator helpdesk. |
| FLOW-04 | Operator helpdesk memverifikasi kelengkapan, menjawab kendala, dan — bila perlu penanganan lanjutan — mendisposisikan tiket ke teknisi yang sesuai. |
| FLOW-05 | Teknisi melakukan penanganan, memperbarui status, mencatat diagnosis dan tindakan, serta berkomunikasi melalui riwayat tiket. |
| FLOW-06 | Jika butuh data tambahan → status **Menunggu Pelapor**; jika bergantung pihak lain → status **Menunggu Pihak Ketiga**. |
| FLOW-07 | Setelah solusi diberikan, operator helpdesk/teknisi mengubah status menjadi **Selesai** dan melampirkan bukti/catatan penyelesaian. |
| FLOW-08 | Pelapor mengonfirmasi hasil, tiket ditutup, pelapor memberikan penilaian; data diperbarui di dashboard dan laporan. |

> Status "Menunggu Pelapor" dan "Menunggu Pihak Ketiga" pada FLOW-06 disebutkan dalam alur proses namun **tidak muncul sebagai baris terpisah** pada tabel Status Tiket resmi di Bagian 11 sumber (kemungkinan merupakan sub-status dari "Diproses" — lihat catatan di Bagian 29).

---

## 11. STATUS TIKET / STATE MACHINE `[STATUS]`

| ID | Status | Keterangan |
|---|---|---|
| `STATUS-OPEN` | Open | Tiket baru diajukan dan menunggu verifikasi/jawaban operator helpdesk. |
| `STATUS-DIPROSES` | Diproses | Operator helpdesk/teknisi sedang melakukan pemeriksaan atau perbaikan. |
| `STATUS-SELESAI` | Selesai/Close | Solusi telah diberikan dan menunggu konfirmasi pelapor. |
| `STATUS-DITOLAK` | Ditolak/Dibatalkan | Laporan tidak valid, duplikat, di luar ruang lingkup, atau dibatalkan dengan alasan yang tercatat. |
| `STATUS-REOPEN` | Dibuka Kembali/Reopen | Tiket diaktifkan kembali karena kendala belum terselesaikan. |

Transisi tersirat dari alur proses (Bagian 10): `Open → Diproses → Selesai/Close → (dikonfirmasi selesai)`, dengan opsi `Selesai/Close → Dibuka Kembali/Reopen → Diproses` bila pelapor belum puas, serta `Open → Ditolak/Dibatalkan` bila laporan tidak valid.

---

## 12. KEBUTUHAN FUNGSIONAL `[FR]`

| ID | Modul | Fungsi yang Dibutuhkan |
|---|---|---|
| FR-01 | Pelapor | Nomor WhatsApp resmi helpdesk IT melalui *scan* barcode, salam pembuka. |
| FR-02 | Menu WhatsApp & Pembuatan Tiket | Menu Buat Tiket (auto-reply menu helpdesk IT), pilih tema keluhan, input keluhan, input data diri (nama, status: mahasiswa/dosen/staf kependidikan/alumni/masyarakat), Cek Status, Tambah Informasi, percakapan terstruktur yang menghasilkan kode tiket otomatis beserta ringkasan link untuk cek status. |
| FR-03 | Webhook, Pesan, dan Lampiran | Penerimaan pesan masuk, status pesan, media yang diizinkan, validasi format, penyimpanan riwayat. |
| FR-04 | Verifikasi dan Disposisi | Pemeriksaan kelengkapan pada dashboard oleh operator helpdesk IT, koreksi kategori/prioritas, penandaan duplikat/tidak valid, penugasan teknisi, serta pemindahan penanggung jawab. |
| FR-05 | Penanganan Teknis | Diagnosis, catatan tindakan, komunikasi yang diteruskan ke WhatsApp, lampiran bukti, perubahan status, waktu kerja, eskalasi, dan pembukaan kembali tiket. |
| FR-06 | SLA dan Notifikasi pada Dashboard Sistem | Target respons dan penyelesaian, indikator sisa waktu, pengingat, eskalasi, serta pesan otomatis untuk tiket baru, permintaan informasi, perubahan status, dan penyelesaian. |
| FR-07 | Dashboard Berbasis Peran | Dashboard operator helpdesk, administrator, teknisi, dan pimpinan dengan antrean, statistik, status pesan, serta data sesuai kewenangan. |
| FR-08 | Basis Pengetahuan dan Jawaban Cepat | FAQ, panduan kendala umum, tautan layanan, jawaban cepat operator, serta rekomendasi artikel berdasarkan kategori tiket. |
| FR-09 | Laporan dan Ekspor | Filter periode, kategori, sub kategori, status, prioritas, operator helpdesk, SLA, kanal interaksi, dan status pengiriman pesan; ekspor PDF/Excel dan chart/diagram. |
| FR-10 | Master Data, Survei, dan Audit | Kategori, petugas, jam layanan, template pesan, keyword/menu, survei kepuasan WhatsApp, log percakapan, audit aktivitas, dan konfigurasi integrasi. |

---

## 13. STRUKTUR MENU BERDASARKAN PERAN `[MENU]`

### 13.1 `MENU-PELAPOR` (via WhatsApp)
**Menu utama:** Mulai/Menu Utama, Buat Tiket, Cek Status Tiket, Tambah Informasi, FAQ/Panduan, Konfirmasi Penyelesaian, Buka Kembali, Survei Kepuasan, Akhiri Percakapan.
**Fungsi:** Mengajukan dan melacak layanan melalui link yang dikirim di chat tanpa login portal, mengirim lampiran, menanggapi operator helpdesk/teknisi, serta menerima pemberitahuan.

### 13.2 `MENU-OPERATOR` (Operator Helpdesk/Verifikator)
**Menu utama:** Dashboard, Percakapan Masuk, Tiket Baru, Verifikasi, Disposisi/Penugasan, Semua Tiket, Pemantauan SLA, Pesan Gagal, Jawaban Cepat, Laporan.
**Fungsi:** Memeriksa percakapan, melengkapi data, mengoreksi kategori/prioritas, menugaskan teknisi, mengambil alih chat, dan memantau antrean.

### 13.3 `MENU-TEKNISI`
**Menu utama:** Dashboard, Tiket Ditugaskan, Tiket Diproses, Menunggu Pelapor, Menunggu Pihak Ketiga, Tiket Selesai, Riwayat Penanganan, Jawaban Cepat, Profil.
**Fungsi:** Menangani pekerjaan, mencatat diagnosis/tindakan, meminta data melalui pesan, melampirkan bukti, dan menyelesaikan tiket.

### 13.4 `MENU-ADMIN` (Administrator Manajemen)
**Menu utama:** Dashboard, Semua Tiket, Percakapan, Pengguna dan Pemetaan Nomor, Unit Kerja, Kategori, Teknisi, SLA, Template Pesan, Menu Bot, Basis Pengetahuan, Survei, Laporan, Audit Log, Integrasi, Pengaturan.
**Fungsi:** Mengelola master data, hak akses, nomor layanan, webhook, template pesan, keamanan, audit, dan operasional aplikasi.

### 13.5 `MENU-PIMPINAN`
**Menu utama:** Dashboard Monitoring Tiket, Pencapaian SLA, Kinerja Teknisi, Statistik Unit, Statistik Percakapan/Pesan, Kepuasan Pengguna, Laporan dan Ekspor.
**Fungsi:** Memantau kinerja layanan, backlog, tren gangguan, keberhasilan notifikasi, beban teknisi, dan bahan evaluasi/laporan.

---

## 14. KATEGORI LAYANAN AWAL `[CAT]`

- **`CAT-1` Aplikasi**
  - a. SSO
    1. Pembuatan akun SSO
    2. Reset akun SSO
    3. Perubahan profil SSO
    4. Reset OTP
    5. SIAP *(tercantum sebagai sub-item SSO pada dokumen asli — lihat catatan Bagian 29)*
       - Perubahan Profile SIAP
       - Perubahan Alamat pada SIAP
  - b. Gentayu
    1. Gentayu Pegawai
    2. Gentayu Mahasiswa
  - c. Mandala
  - d. E-office
  - e. Lainnya
- **`CAT-2` Website dan Email**
  - a. Domain
  - b. Website
  - c. Email
  - d. Lisensi
- **`CAT-3` Jaringan dan Internet**
  - a. WiFi
  - b. VPN
  - c. VM
- **`CAT-4` Cyber dan Security**
  - a. Backdoor
  - b. Keamanan Sistem

**Aturan agent:** taksonomi ini adalah "kategori layanan **awal**" (baseline) — perluasan kategori tetap dimungkinkan tapi harus melalui `ROLE-ADMIN` (Master Data, Bagian 13.4/FR-10), bukan ditambahkan sepihak oleh agent tanpa eskalasi.

---

## 15. PRIORITAS DAN SLA `[SLA]`

| ID | Prioritas | Kriteria | Target Respons | Target Penyelesaian |
|---|---|---|---|---|
| `SLA-KRITIS` | Kritis | Layanan utama berhenti, akun penting terkompromi, atau gangguan berdampak luas. | 1 jam kerja | 24 jam kerja |
| `SLA-TINGGI` | Tinggi | Menghambat layanan utama pada fakultas, direktorat, atau unit kerja dan tidak tersedia alternatif memadai. | 1 jam kerja | 24 jam kerja |
| `SLA-SEDANG` | Sedang | Mengganggu pekerjaan, tetapi terdapat alternatif sementara. | 2 jam kerja | 2 hari kerja |
| `SLA-RENDAH` | Rendah | Permintaan rutin, konsultasi, instalasi, atau perubahan yang tidak mendesak. | 4 jam kerja | 5 hari kerja |

> **Catatan sumber:** Target SLA merupakan rancangan awal dan mulai dihitung setelah tiket dinyatakan valid. Tiket yang menunggu data pelapor, vendor, atau pengelola aplikasi pusat dapat dijeda sesuai aturan. Status jeda, alasan, dan waktu pengiriman pesan WhatsApp wajib tercatat.
>
> **Perhatian agent:** `SLA-KRITIS` dan `SLA-TINGGI` memiliki target respons & penyelesaian yang **identik** (1 jam kerja / 24 jam kerja) pada dokumen sumber — bedanya hanya di kriteria dampak, bukan di angka waktu. Jangan mengasumsikan Kritis punya SLA lebih ketat dari Tinggi kecuali ada klarifikasi tambahan dari pemberi tugas.

---

## 16. RANCANGAN KANAL WHATSAPP DAN DASHBOARD INTERNAL `[DASH]`

Pelapor berinteraksi melalui menu percakapan WhatsApp; operator helpdesk, teknisi, administrator, dan pimpinan menggunakan dashboard web sesuai kewenangannya. Data percakapan, tiket, SLA, media, dan status pengiriman pesan **tersinkron pada satu basis data**.

| ID | Jenis Dashboard | Komponen yang Ditampilkan | Fungsi Utama |
|---|---|---|---|
| `DASH-PELAPOR` | Layanan Pelapor (WhatsApp) | Salam & menu utama; Buat Tiket; Cek Status; Tambah Informasi; FAQ; konfirmasi penyelesaian; buka kembali; survei; ringkasan tiket dan notifikasi. | Kanal bantuan mudah tanpa perlu login web. |
| `DASH-OPERATOR` | Dashboard Operator Helpdesk | Identifikasi operator, percakapan/tiket masuk, belum diverifikasi, belum ditugaskan, diproses, menunggu, selesai, melewati SLA, pesan gagal, prioritas, disposisi cepat. | Verifikasi, klasifikasi, penugasan, ambil alih chat, pemantauan antrean, cegah pesan terlewat. |
| `DASH-TEKNISI` | Dashboard Teknisi | Tiket ditugaskan, prioritas kritis/tinggi, tenggat SLA, menunggu pelapor, pekerjaan hari ini, selesai hari ini, riwayat penanganan, tombol kirim pembaruan. | Membantu teknisi memprioritaskan pekerjaan & kirim update ke WhatsApp pelapor. |
| `DASH-ADMIN` | Dashboard Administrator | Statistik tiket & percakapan, pengguna/nomor terverifikasi, unit kerja, kategori, petugas, template pesan, webhook, SLA, log aktivitas, kesehatan integrasi. | Mengelola konfigurasi WhatsApp, master data, akses, audit, operasional aplikasi. |
| `DASH-PIMPINAN` | Dashboard Pimpinan | Volume tiket/percakapan, tren, kategori, sub kategori, pencapaian SLA, respons/penyelesaian, backlog, beban teknisi, status pengiriman pesan, kepuasan pengguna. | Gambaran kinerja layanan, dasar evaluasi & pengambilan keputusan. |

### 16.1 Filter dan Indikator Umum

| Elemen | Rincian |
|---|---|
| Filter Utama | Rentang tanggal, fakultas/unit asal, kategori layanan, status tiket, prioritas, operator helpdesk IT, teknisi, pencapaian SLA, status pesan, nomor/kode tiket, kata kunci. |
| Kartu Ringkasan | Total percakapan, tiket hari ini, tiket baru, belum ditugaskan, diproses, menunggu, selesai, ditutup, melewati SLA, pesan gagal. |
| Grafik | Periode tiket, distribusi kategori, status, prioritas, pencapaian SLA, beban teknisi, keberhasilan pengiriman pesan. |
| Daftar Cepat | Percakapan terbaru, tiket prioritas tinggi, tiket mendekati SLA, pesan yang gagal diproses, tiket terlama, tiket yang membutuhkan tindakan pelapor. |
| Ekspor | Rekap dashboard, detail tiket, riwayat status, statistik pesan → Excel atau PDF sesuai hak akses dan kebijakan privasi. |

---

## 17. KEBUTUHAN NONFUNGSIONAL `[NFR]`

| ID | Aspek | Kebutuhan |
|---|---|---|
| NFR-01 | Keamanan | Nomor WhatsApp resmi, webhook HTTPS dan tervalidasi, penyimpanan token secara aman, RBAC dashboard, verifikasi identitas, minimisasi data, pembatasan media, audit log, larangan meminta kata sandi/OTP. |
| NFR-02 | Kinerja | Pemrosesan pesan dan respons menu cepat; respons API maksimal 3 detik pada kondisi normal; mekanisme antrean & retry untuk mencegah kehilangan pesan. |
| NFR-03 | Ketersediaan | Layanan penerimaan tiket dapat digunakan sesuai jam kerja operasional; pesan di luar jam operasional tetap dicatat dan memperoleh informasi waktu layanan. |
| NFR-04 | Kemudahan Penggunaan | Percakapan Bahasa Indonesia yang jelas, nomor menu singkat, validasi input, tombol/opsi konsisten, mekanisme kembali ke menu utama. |
| NFR-05 | Pencadangan | Basis data, konfigurasi, riwayat tiket, media yang diizinkan dicadangkan otomatis dengan prosedur pemulihan terdokumentasi. |
| NFR-06 | Pemeliharaan | Kode sumber & alur bot terdokumentasi, template pesan mudah dikelola, integrasi dipantau, tersedia mekanisme pembaruan & penanganan gangguan provider. |

---

## 18. ARSITEKTUR APLIKASI `[ARCH]`

Arsitektur hibrida:

```
Pelapor via WhatsApp ──┐
                        ├──> Nomor WhatsApp Resmi ──> Webhook/API Back-End ──> Basis Data & Media
Petugas via Web ────────┘         (Dashboard Internal) ──────────────┘
```

- Pelapor menggunakan **nomor WhatsApp resmi** yang terhubung ke WhatsApp Business API atau gateway resmi melalui **webhook**.
- Webhook meneruskan pesan ke API/back-end untuk validasi, pengelolaan tiket, penyimpanan media, SLA, dan notifikasi.
- Operator, teknisi, administrator, dan pimpinan mengakses **dashboard web internal** dengan hak akses berbasis peran dan asal unit kerja.

---

## 19. RENCANA TEKNOLOGI `[TECH]`

| ID | Komponen | Rencana (kandidat, belum final) |
|---|---|---|
| TECH-01 | Kanal Pelapor | WhatsApp Business Platform atau gateway resmi/penyedia yang disetujui organisasi. |
| TECH-02 | Dashboard Internal | React **atau** Vue.js dengan antarmuka responsif untuk petugas dan pimpinan. |
| TECH-03 | Back-End dan API | Node.js/Express.js **atau** Laravel untuk logika tiket, webhook, SLA, dan integrasi. |
| TECH-04 | Basis Data dan Media | PostgreSQL **atau** MySQL; penyimpanan lampiran terkontrol dengan retensi yang ditetapkan. |
| TECH-05 | Webhook dan Antrean | Endpoint HTTPS tervalidasi, pemrosesan asinkron, retry, idempotensi, pencatatan status pesan. |
| TECH-06 | Web Server dan Deployment | Nginx **atau** Apache pada Linux; Docker dapat digunakan; server internal atau cloud yang disetujui. |
| TECH-07 | Keamanan dan Monitoring | Manajemen secret/token, RBAC, audit log, backup, monitoring layanan, Git untuk pengelolaan kode sumber. |

> **Aturan agent:** semua opsi di atas ditulis dengan kata "atau" — artinya **belum ada keputusan final**. Jika AI agent harus memilih satu (misalnya untuk mulai coding), agent wajib menyatakan asumsi pilihannya secara eksplisit dan menandainya sebagai *keputusan yang perlu dikonfirmasi*, bukan memilih diam-diam seolah itu ketentuan proposal.

---

## 20. KEAMANAN APLIKASI `[SEC]`

| ID | Ketentuan Keamanan |
|---|---|
| SEC-01 | Penggunaan nomor WhatsApp resmi dan integrasi API/gateway yang disetujui — **bukan** akun pribadi petugas. |
| SEC-02 | Autentikasi dashboard internal yang aman serta kontrol akses berbasis peran dan asal fakultas/unit kerja. |
| SEC-03 | Verifikasi identitas pelapor melalui pemetaan nomor telepon dan data NIP/NIM/email, atau mekanisme verifikasi yang ditetapkan. |
| SEC-04 | Validasi jenis, ukuran, dan keamanan lampiran, serta penyimpanan media di lokasi yang terkendali. |
| SEC-05 | Validasi webhook, HTTPS, penyimpanan kredensial secara aman, rate limiting, dan perlindungan terhadap serangan aplikasi umum. |
| SEC-06 | Pencatatan percakapan, status pengiriman pesan, perubahan tiket, dan aktivitas petugas melalui audit log. |
| SEC-07 | Penerapan minimisasi data, masa retensi, penyamaran nomor pada laporan, dan **larangan meminta kata sandi atau kode OTP melalui chat**. |
| SEC-08 | Pencadangan berkala, pengujian pemulihan, pembaruan dependensi, serta prosedur penanganan gangguan layanan WhatsApp. |

---

## 21. METODE PELAKSANAAN `[PHASE]`

| ID | Tahap | Kegiatan |
|---|---|---|
| PHASE-01 | Analisis Kebutuhan | Wawancara, pemetaan proses, penetapan nomor layanan, peran, kategori, alur percakapan, SLA, privasi, kebutuhan laporan. |
| PHASE-02 | Perancangan | Perancangan menu WhatsApp, skenario pesan, basis data, dashboard, webhook, arsitektur, keamanan, rencana pengujian. |
| PHASE-03 | Pengembangan | Pembuatan integrasi WhatsApp, webhook, basis data, API, dashboard, tiket, SLA, notifikasi, basis pengetahuan, laporan. |
| PHASE-04 | Pengujian | Pengujian pesan masuk/keluar, lampiran, duplikasi, retry, fungsi, hak akses, keamanan, kinerja, User Acceptance Testing. |
| PHASE-05 | Implementasi | Aktivasi nomor/integrasi resmi, konfigurasi server, domain/HTTPS dashboard, akun petugas, backup, sosialisasi, pelatihan. |
| PHASE-06 | Pemeliharaan Awal | Perbaikan kesalahan, optimasi alur percakapan, monitoring webhook/pesan, dukungan pengguna, evaluasi pascaimplementasi. |

---

## 22. JADWAL PELAKSANAAN `[WEEK]`

| ID | Durasi (Minggu) | Kegiatan |
|---|---|---|
| WEEK-01 | 1 | Analisis kebutuhan, nomor layanan, kebijakan data, dan proses bisnis. |
| WEEK-02 | 1 | Perancangan arsitektur, basis data, webhook, SLA, dan keamanan. |
| WEEK-03 | 1 | Perancangan menu percakapan, template pesan, dan prototipe dashboard. |
| WEEK-04 | 2 | Pengembangan integrasi WhatsApp, webhook, dan verifikasi pelapor. |
| WEEK-05 | 2 | Pengembangan mesin tiket, disposisi, penanganan, dan lampiran. |
| WEEK-06 | 1 | Pengembangan SLA, notifikasi WhatsApp, FAQ, dan jawaban cepat. |
| WEEK-07 | 1 | Pengembangan dashboard, laporan, survei, dan audit log. |
| WEEK-08 | 1 | Integrasi serta pengujian pesan, fungsi, keamanan, dan kinerja. |
| WEEK-09 | 1 | User Acceptance Testing dan perbaikan alur percakapan. |
| WEEK-10 | 1 | Implementasi, pelatihan, sosialisasi nomor resmi, dan serah terima. |

**Total durasi (dihitung dari kolom Minggu di atas):** 1+1+1+2+2+1+1+1+1+1 = **12 minggu (± 3 bulan)** — angka ini konsisten dengan "Durasi Pelaksanaan: 3 bulan" di Lembar Pengesahan (Bagian 1), tetapi berbeda dari kalimat "Pengembangan direncanakan selama 2 bulan" di Ringkasan (Bagian 2). Lihat Bagian 29.

---

## 23. KELUARAN KEGIATAN (DELIVERABLES) `[DELIV]`

| ID | Keluaran |
|---|---|
| DELIV-01 | Dokumen kebutuhan dan proses bisnis. |
| DELIV-02 | Desain antarmuka dan basis data. |
| DELIV-03 | Aplikasi Helpdesk IT berbasis WhatsApp untuk pelapor dan dashboard web internal untuk pengelola layanan UNDIP. |
| DELIV-04 | Kode sumber, konfigurasi webhook, integrasi WhatsApp, API, dashboard, dan deployment. |
| DELIV-05 | Dokumentasi teknis serta panduan penggunaan WhatsApp bagi pelapor dan dashboard bagi operator helpdesk, teknisi, administrator, serta pimpinan UNDIP. |
| DELIV-06 | Laporan pengujian dan berita acara User Acceptance Testing. |
| DELIV-07 | Pelatihan serta serah terima aplikasi. |
| DELIV-08 | Dukungan pemeliharaan awal selama tiga bulan. |

---

## 24. RENCANA ANGGARAN BIAYA `[BUDGET]`

| No. | Uraian | Vol. | Satuan | Harga Satuan | Jumlah |
|---|---|---|---|---|---|
| 1 | Pembuatan aplikasi | 1 | paket | Rp30.000.000 | Rp30.000.000 |
| | | | | **Total** | **Rp54.000.000** |

> ⚠️ **Inkonsistensi angka pada dokumen sumber:** satu-satunya baris item RAB berjumlah Rp30.000.000, namun baris Total tertulis Rp54.000.000 — selisih Rp24.000.000 tidak dijelaskan (tidak ada rincian item lain). Angka ini juga sama dengan "Perkiraan Anggaran Rp30.000.000,00" pada Lembar Pengesahan (Bagian 1). **AI agent tidak boleh memilih salah satu angka secara sepihak** (mis. menganggap Rp54 juta sebagai anggaran final) — tandai sebagai butir yang wajib diklarifikasi ke pengusul/ketua tim sebelum dipakai untuk keputusan pengadaan, RAB turunan, atau estimasi biaya lanjutan.
>
> Catatan tambahan pada dokumen sumber: *"Rencana Anggaran Biaya berikut merupakan estimasi awal. Nilai akhir perlu disesuaikan dengan mekanisme pengadaan, kebijakan organisasi, pemanfaatan personel internal, ketersediaan infrastruktur, serta ruang lingkup fitur yang disepakati."*

---

## 25. PENUTUP (RINGKASAN) `[CLOSING]`

Pembuatan Aplikasi Helpdesk IT berbasis WhatsApp merupakan langkah strategis untuk meningkatkan kualitas dukungan teknologi di UNDIP. Sistem memanfaatkan kanal yang sudah akrab bagi pengguna untuk menyatukan pengajuan, verifikasi, disposisi, penanganan, pelacakan, evaluasi SLA, dan laporan dalam satu layanan resmi. Dengan dukungan pimpinan universitas, pengelola TI, petugas helpdesk, teknisi, pengelola fakultas/unit kerja, dan pengguna, aplikasi diharapkan meningkatkan kemudahan akses, kecepatan layanan, keterlacakan pekerjaan, akuntabilitas, keamanan data, dan kepuasan pengguna. Proposal ini diharapkan menjadi dasar pelaksanaan pembuatan aplikasi dan pengelolaan nomor WhatsApp Helpdesk IT UNDIP.

---

## 26. LAMPIRAN 1 — CONTOH ALUR PERCAKAPAN DAN DATA TIKET WHATSAPP `[LAMP1]`

| ID | Kolom | Isi |
|---|---|---|
| LAMP1-01 | Pesan Awal | Pelapor mengirim "Halo" ke nomor Helpdesk IT UNDIP; sistem menampilkan informasi layanan, persetujuan pemrosesan data, dan menu utama. |
| LAMP1-02 | Menu Utama | 1. Buat Tiket \| 2. Cek Status \| 3. Tambah Informasi \| 4. FAQ/Panduan \| 5. Hubungi Petugas \| 6. Survei \| 0. Akhiri. |
| LAMP1-03 | Identitas Pelapor | Nomor WhatsApp, nama, NIP/NIM/email bila diperlukan, dan asal rektorat/fakultas/sekolah/direktorat/lembaga/UPT/program studi/unit kerja. |
| LAMP1-04 | Data Permasalahan | Kategori layanan/aplikasi, judul singkat, deskripsi, waktu kejadian, dampak, lokasi/perangkat, tingkat urgensi. |
| LAMP1-05 | Lampiran | Tangkapan layar, foto, atau dokumen sesuai jenis dan ukuran yang diizinkan. Sistem mengingatkan agar tidak mengirim kata sandi atau OTP. |
| LAMP1-06 | Konfirmasi | Sistem menampilkan ringkasan data. Pelapor memilih Kirim, Ubah, atau Batal. |
| LAMP1-07 | Tiket Terbentuk | Sistem mengirim kode tiket, status Baru, waktu pembuatan, dan cara memeriksa perkembangan. |
| LAMP1-08 | Pembaruan Tiket | Pelapor menerima notifikasi saat tiket diverifikasi, ditugaskan, membutuhkan informasi, diproses, selesai, ditutup, atau dibuka kembali. |
| LAMP1-09 | Penyelesaian dan Survei | Pelapor memilih Selesai atau Buka Kembali, kemudian memberikan penilaian layanan dan komentar. |

---

## 27. LAMPIRAN 2 — CHECKLIST USER ACCEPTANCE TESTING BERBASIS WHATSAPP `[UAT]`

| ID | Skenario | Hasil yang Diharapkan | Status |
|---|---|---|---|
| UAT-01 | Pesan awal dan menu WhatsApp | Nomor resmi membalas dan menampilkan persetujuan data serta menu yang dapat dipilih tanpa percakapan membingungkan. | [ ] Lulus [ ] Tidak |
| UAT-02 | Verifikasi pelapor dan pembuatan tiket | Identitas dan unit tervalidasi, tiket tersimpan, kode otomatis dibuat, ringkasan dikirim, tiket tampil pada dashboard. | [ ] Lulus [ ] Tidak |
| UAT-03 | Lampiran, format salah, duplikasi, dan fallback | Media yang diizinkan tersimpan; input salah mendapat panduan; pesan duplikat tidak membuat tiket ganda; tersedia pengalihan ke operator. | [ ] Lulus [ ] Tidak |
| UAT-04 | Verifikasi dan disposisi pada dashboard | Operator dapat memperbaiki kategori/prioritas, menandai duplikat/tidak valid, dan menugaskan tiket. | [ ] Lulus [ ] Tidak |
| UAT-05 | Penanganan dan komunikasi teknisi | Diagnosis, tindakan, status, lampiran, petugas, dan waktu tercatat; pembaruan diterima di WhatsApp pelapor. | [ ] Lulus [ ] Tidak |
| UAT-06 | Perhitungan SLA, pengingat, dan eskalasi | Target, sisa waktu, jeda, peringatan, dan pelanggaran SLA tampil benar; notifikasi terkirim sesuai aturan. | [ ] Lulus [ ] Tidak |
| UAT-07 | Cek status dan tambah informasi melalui WhatsApp | Pelapor dapat memilih tiket aktif, melihat status, dan menambahkan data pada tiket yang tepat. | [ ] Lulus [ ] Tidak |
| UAT-08 | Penyelesaian, buka kembali, dan survei | Pelapor menerima ringkasan solusi, dapat mengonfirmasi, membuka kembali, dan mengisi penilaian. | [ ] Lulus [ ] Tidak |
| UAT-09 | Dashboard, filter, laporan, dan status pesan | Dashboard sesuai hak akses; filter dan ekspor berfungsi; pesan gagal dapat ditelusuri dan diproses ulang. | [ ] Lulus [ ] Tidak |
| UAT-10 | Keamanan, audit, backup, dan pemulihan | Webhook valid; token aman; RBAC dan audit aktif; data sensitif tidak diminta; backup dapat dipulihkan. | [ ] Lulus [ ] Tidak |

*(Checklist ini masih kosong pada dokumen sumber — dimaksudkan untuk diisi saat UAT aktual dilaksanakan.)*

---

## 28. GLOSARIUM *(tambahan penjelasan — bukan bagian asli proposal, disusun untuk membantu pemahaman AI agent)*

| Istilah | Penjelasan |
|---|---|
| SLA (Service Level Agreement) | Kesepakatan target waktu respons dan penyelesaian layanan. |
| RBAC (Role-Based Access Control) | Kontrol akses berdasarkan peran pengguna (Pelapor, Operator, Teknisi, Admin, Pimpinan). |
| Disposisi | Proses meneruskan/menugaskan tiket dari operator helpdesk ke teknisi yang sesuai. |
| Eskalasi | Peningkatan penanganan tiket (mis. ke petugas lain/level lebih tinggi) karena mendekati/melewati tenggat SLA. |
| Webhook | Mekanisme penerimaan data otomatis (pesan WhatsApp masuk) dari penyedia layanan ke sistem back-end. |
| Idempotensi | Sifat proses yang bila dijalankan berulang dengan input sama tidak menghasilkan efek ganda (mis. mencegah tiket duplikat). |
| Audit log | Catatan aktivitas sistem/pengguna untuk keperluan pelacakan dan akuntabilitas. |
| Minimisasi data | Prinsip hanya menyimpan/menampilkan data pribadi seperlunya sesuai kebutuhan layanan. |

---

## 29. CATATAN DAN ANOMALI PADA DOKUMEN SUMBER `[NOTES]`

AI agent **wajib memperlakukan poin-poin berikut sebagai area abu-abu**, bukan sebagai fakta pasti — jangan menebak jawabannya sendiri, eskalasi ke manusia (Ketua Tim/Administrator) bila relevan dengan tugas yang sedang dikerjakan.

1. **RAB tidak konsisten** — item RAB berjumlah Rp30.000.000 tapi Total tertulis Rp54.000.000 (Bagian 24).
2. **Penomoran bab meloncat** — dari BAB VI (Rencana Anggaran Biaya) langsung ke BAB VIII (Penutup); BAB VII tidak ada di dokumen sumber sama sekali.
3. **Durasi proyek disebut berbeda-beda**: Lembar Pengesahan menyatakan "3 bulan"; Ringkasan menyatakan "pengembangan direncanakan selama 2 bulan"; sementara total kolom "Minggu" pada Jadwal Pelaksanaan berjumlah 12 minggu (≈3 bulan). Kemungkinan "2 bulan" di Ringkasan tidak termasuk fase UAT/implementasi, tapi ini tidak dinyatakan eksplisit.
4. **PROB-03** pada Identifikasi Permasalahan ditulis sebagai kalimat solusi ("Menyediakan nomor tiket otomatis..."), bukan kalimat masalah seperti butir lain di bagian yang sama.
5. **Sub-kategori "SIAP"** dituliskan sebagai butir ke-5 di bawah "SSO" (Bagian 14/CAT-1), padahal SIAP tampak seperti aplikasi/sistem informasi tersendiri, bukan bagian dari SSO. Tidak ada penjelasan lebih lanjut di dokumen sumber.
6. **Status "Menunggu Pelapor" dan "Menunggu Pihak Ketiga"** disebut dalam Alur Proses Layanan (FLOW-06) dan muncul di Menu Teknisi (Bagian 13.3), tetapi **tidak** terdaftar sebagai baris resmi pada tabel Status Tiket (Bagian 11). Kemungkinan merupakan sub-status dari "Diproses", tapi tidak dinyatakan eksplisit.
7. **Pilihan teknologi masih berupa alternatif** ("React atau Vue.js", "Node.js/Express.js atau Laravel", "PostgreSQL atau MySQL", "Nginx atau Apache") — belum ada keputusan final tercatat di proposal (Bagian 19).
8. **SLA Kritis dan Tinggi memiliki angka target yang identik** (1 jam kerja respons / 24 jam kerja penyelesaian) meski kriteria dampaknya berbeda (Bagian 15).
9. Dokumen sumber yang diterima **belum menunjukkan tanda tangan basah/digital** pada kolom pengesahan meski tanggal pengesahan (15 Juni 2026) sudah dicantumkan.

---

## 30. CHECKLIST KEPATUHAN UNTUK AI AGENT `[COMPLIANCE]`

Gunakan checklist ini sebagai self-review **sebelum** menyerahkan hasil kerja (kode, desain, copy, laporan, jawaban) terkait proyek ini:

- [ ] Tugas yang dikerjakan termasuk dalam Ruang Lingkup (`SCOPE-01` s.d. `SCOPE-06`, Bagian 8)? Jika di luar lingkup, sudah ditandai dan dikonfirmasi ke manusia?
- [ ] Peran dan hak akses yang dipakai sesuai `ROLE-*` (Bagian 9)?
- [ ] Kategori layanan yang dirujuk sesuai `CAT-*` (Bagian 14)? Jika perlu kategori baru, sudah ditandai sebagai usulan (bukan asumsi final)?
- [ ] Status tiket yang dipakai sesuai `STATUS-*` (Bagian 11), bukan istilah buatan sendiri?
- [ ] Target waktu yang disebutkan sesuai `SLA-*` (Bagian 15)?
- [ ] Nama menu/istilah UI sesuai `MENU-*` per peran (Bagian 13)?
- [ ] Tidak melanggar satu pun ketentuan `SEC-*` (Bagian 20), terutama larangan minta password/OTP (SEC-07)?
- [ ] Kebutuhan nonfungsional relevan (`NFR-*`, Bagian 17) — misalnya batas waktu respons API 3 detik — sudah dipertimbangkan?
- [ ] Pilihan teknologi (bila ada) merujuk opsi di `TECH-*` (Bagian 19) atau disertai justifikasi bila menyimpang?
- [ ] Jika menyentuh anggaran/jadwal, sudah merujuk Bagian 22/24 **dan** mencantumkan catatan ambiguitas terkait (Bagian 29) alih-alih memilih satu angka secara sepihak?
- [ ] Ambiguitas yang ditemukan sudah dieskalasi ke manusia, bukan diputuskan sendiri oleh agent?

---

## 31. ATURAN TEGAS / GUARDRAILS (TIDAK BOLEH DILANGGAR) `[GUARDRAIL]`

- **JANGAN** merancang/mengimplementasikan fitur yang meminta kata sandi atau kode OTP melalui percakapan WhatsApp (SEC-07).
- **JANGAN** menyarankan atau mengimplementasikan penggunaan nomor WhatsApp pribadi petugas untuk komunikasi resmi (SEC-01).
- **JANGAN** membuat kategori layanan baru di luar `CAT-1` s.d. `CAT-4` tanpa proses eskalasi/persetujuan melalui jalur Administrator (FR-10, Bagian 14).
- **JANGAN** melewati tahap verifikasi operator helpdesk (`ROLE-OPERATOR`) sebelum tiket didisposisikan ke teknisi (FLOW-04).
- **JANGAN** mengubah angka target SLA (`SLA-KRITIS/TINGGI/SEDANG/RENDAH`) tanpa otorisasi eksplisit dari Administrator/pemberi tugas.
- **JANGAN** memilih salah satu angka RAB (Rp30 juta vs Rp54 juta) sebagai kebenaran final tanpa klarifikasi (Bagian 24, 29).
- **WAJIB** mencatat setiap perubahan status tiket dan komunikasi ke audit log (SEC-06).
- **WAJIB** menerapkan RBAC sesuai peran (Bagian 9) sebelum menampilkan data tiket/dashboard ke pengguna mana pun.
- **WAJIB** menyamarkan/melindungi nomor telepon pelapor pada laporan sesuai prinsip minimisasi data (SEC-07).
- **WAJIB** menjaga agar seluruh istilah (status, kategori, prioritas, nama menu) konsisten persis dengan Bagian 11, 13, 14, dan 15 dokumen ini.

---

*Dokumen ini disusun ulang dari proposal asli tanpa mengurangi satu pun ketentuan, angka, tabel, atau daftar yang tercantum di dalamnya; seluruh penambahan (ID kode, glosarium, catatan anomali, checklist, dan guardrail) ditandai secara eksplisit sebagai suplemen di luar teks asli proposal.*
