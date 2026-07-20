-- ==========================================
-- DANGER ZONE: RESET DATA
-- ==========================================
-- Hapus semua data yang berhubungan dengan kategori dan tiket
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE tickets CASCADE;
TRUNCATE TABLE categories CASCADE;

-- ==========================================
-- ALTER TABLE CATEGORIES
-- ==========================================
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ==========================================
-- SEEDER KATEGORI (HIERARKI)
-- ==========================================
DO $$
DECLARE
    id_aplikasi UUID;
    id_sso UUID;
    id_siap UUID;
    id_gentayu UUID;

    id_web_email UUID;
    id_jaringan UUID;
    id_cyber UUID;
BEGIN
    -- 1. ROOT CATEGORIES (Level 1)
    INSERT INTO categories (name, description, level, sort_order) VALUES 
    ('Aplikasi', 'Layanan aplikasi internal', 1, 1) RETURNING id INTO id_aplikasi;

    INSERT INTO categories (name, description, level, sort_order) VALUES 
    ('Website dan Email', 'Kendala website resmi dan email', 1, 2) RETURNING id INTO id_web_email;

    INSERT INTO categories (name, description, level, sort_order) VALUES 
    ('Jaringan dan Internet', 'Kendala WiFi, VPN, dsb', 1, 3) RETURNING id INTO id_jaringan;

    INSERT INTO categories (name, description, level, sort_order) VALUES 
    ('Cyber Security', 'Keamanan sistem dan insiden', 1, 4) RETURNING id INTO id_cyber;

    -- ==========================================
    -- 2. CHILD KATEGORI: APLIKASI (Level 2)
    -- ==========================================
    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_aplikasi, 'SSO', 2, 1) RETURNING id INTO id_sso;

    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_aplikasi, 'Gentayu', 2, 2) RETURNING id INTO id_gentayu;

    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_aplikasi, 'Mandala', 2, 3),
    (id_aplikasi, 'E-Office', 2, 4),
    (id_aplikasi, 'Lainnya', 2, 5);

    -- ==========================================
    -- 3. CHILD KATEGORI: APLIKASI -> SSO (Level 3)
    -- ==========================================
    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_sso, 'Pembuatan Akun', 3, 1),
    (id_sso, 'Reset Akun', 3, 2),
    (id_sso, 'Perubahan Profil', 3, 3),
    (id_sso, 'Reset OTP', 3, 4);

    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_sso, 'SIAP', 3, 5) RETURNING id INTO id_siap;

    -- ==========================================
    -- 4. CHILD KATEGORI: APLIKASI -> SSO -> SIAP (Level 4)
    -- ==========================================
    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_siap, 'Perubahan Profil', 4, 1),
    (id_siap, 'Perubahan Alamat', 4, 2);

    -- ==========================================
    -- 5. CHILD KATEGORI: APLIKASI -> GENTAYU (Level 3)
    -- ==========================================
    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_gentayu, 'Pegawai', 3, 1),
    (id_gentayu, 'Mahasiswa', 3, 2);


    -- ==========================================
    -- 6. CHILD KATEGORI: WEBSITE & EMAIL (Level 2)
    -- ==========================================
    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_web_email, 'Domain', 2, 1),
    (id_web_email, 'Website', 2, 2),
    (id_web_email, 'Email', 2, 3),
    (id_web_email, 'Lisensi', 2, 4);

    -- ==========================================
    -- 7. CHILD KATEGORI: JARINGAN (Level 2)
    -- ==========================================
    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_jaringan, 'WiFi', 2, 1),
    (id_jaringan, 'VPN', 2, 2),
    (id_jaringan, 'VM', 2, 3);

    -- ==========================================
    -- 8. CHILD KATEGORI: CYBER (Level 2)
    -- ==========================================
    INSERT INTO categories (parent_id, name, level, sort_order) VALUES 
    (id_cyber, 'Backdoor', 2, 1),
    (id_cyber, 'Keamanan Sistem', 2, 2);

END $$;
