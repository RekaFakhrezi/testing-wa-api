# HaloDesk - WhatsApp Helpdesk System

Sistem ticketing Helpdesk IT terintegrasi dengan WhatsApp Bot. 

## Daftar Akun Uji Coba (Sandbox)
Sistem ini menggunakan Mock Authentication di environment sandbox (hanya menggunakan Email). Berikut adalah daftar akun bawaan (Seeder) yang bisa Anda gunakan untuk *login* ke Dashboard:

**Password untuk semua akun:** `HaloDesk123!`

### Administrator & Operator
| Nama | Role | Email Login |
|------|------|-------------|
| System Administrator | Administrator | `admin@halodesk.com` |
| Admin Operator Utama | Operator Helpdesk | `operator@halodesk.com` |

### Teknisi (Agent)
| Nama | Unit Kerja (Departemen) | Email Login |
|------|-------------------------|-------------|
| Andi Software | Unit Software & Aplikasi | `agent.software@halodesk.com` |
| Budi Hardware | Unit Hardware & Perangkat | `agent.hardware@halodesk.com` |
| Citra Jaringan | Unit Jaringan & Infrastruktur | `agent.jaringan@halodesk.com` |
| Deni Keamanan | Unit Keamanan Siber | `agent.keamanan@halodesk.com` |

---

## Memulai Aplikasi
1. Jalankan `npm run dev`
2. Buka `http://localhost:3000`
3. Gunakan **Simulator WhatsApp** di `/simulator` untuk mencoba mengirim tiket sebagai Pengguna/Pelapor.
4. Gunakan **Login Dashboard** di `/login` untuk masuk sebagai Operator/Teknisi/Admin.
