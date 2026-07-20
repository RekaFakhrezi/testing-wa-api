-- ==========================================
-- MIGRATION PART 4: REAL AUTHENTICATION
-- ==========================================

-- 1. Tambah kolom email dan auth_id di tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE; -- Menyimpan relasi ke auth.users(id)

-- 2. Hapus referensi teknisi di tabel tickets agar tidak melanggar foreign key
UPDATE tickets SET technician_id = NULL WHERE technician_id IN (SELECT id FROM users WHERE role IN ('TEKNISI', 'OPERATOR_HELPDESK'));

-- 3. Hapus log audit yang berkaitan dengan teknisi & operator lama
DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE role IN ('TEKNISI', 'OPERATOR_HELPDESK'));

-- 4. Hapus teknisi & operator lama (yang dibuat dari dummy Part 3)
-- karena kita akan membuatnya ulang secara otomatis melalui API Route yang akan
-- mendaftarkan akun di auth.users secara otomatis!
DELETE FROM users WHERE role IN ('TEKNISI', 'OPERATOR_HELPDESK');

-- Catatan:
-- Pelapor (PELAPOR) tidak akan dihapus karena mereka terkait dengan pesan-pesan sebelumnya.
-- Setelah ini, buka http://localhost:3000/api/setup-auth di browser untuk generate 5 akun otomatis!
