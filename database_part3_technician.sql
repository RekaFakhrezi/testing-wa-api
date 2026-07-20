-- ==========================================
-- MIGRATION PART 3: TECHNICIAN DEPARTMENTS
-- ==========================================

-- 1. Buat Tabel Departemen/Unit
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tambah relasi department ke users
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- 3. Tambah relasi department ke tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- ==========================================
-- SEED DATA DEFAULT
-- ==========================================

-- A. Insert 4 Departemen Dummy (Hanya insert jika belum ada)
INSERT INTO departments (name, description)
SELECT 'Unit Software & Aplikasi', 'Menangani kendala software, aplikasi web, dan sistem internal'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Unit Software & Aplikasi');

INSERT INTO departments (name, description)
SELECT 'Unit Hardware & Perangkat', 'Menangani kendala PC, Laptop, Printer, dan peripheral'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Unit Hardware & Perangkat');

INSERT INTO departments (name, description)
SELECT 'Unit Jaringan & Infrastruktur', 'Menangani kendala WiFi, LAN, Server, dan konektivitas'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Unit Jaringan & Infrastruktur');

INSERT INTO departments (name, description)
SELECT 'Unit Keamanan Siber', 'Menangani kendala keamanan data, akses, dan peretasan'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Unit Keamanan Siber');

-- B. Insert Teknisi per Departemen
-- Kita perlu mengambil ID dari department yang baru dibuat.
DO $$
DECLARE
    dep_software UUID;
    dep_hardware UUID;
    dep_jaringan UUID;
    dep_keamanan UUID;
BEGIN
    SELECT id INTO dep_software FROM departments WHERE name = 'Unit Software & Aplikasi' LIMIT 1;
    SELECT id INTO dep_hardware FROM departments WHERE name = 'Unit Hardware & Perangkat' LIMIT 1;
    SELECT id INTO dep_jaringan FROM departments WHERE name = 'Unit Jaringan & Infrastruktur' LIMIT 1;
    SELECT id INTO dep_keamanan FROM departments WHERE name = 'Unit Keamanan Siber' LIMIT 1;

    -- Insert Teknisi Software
    INSERT INTO users (phone_number, name, identity_number, faculty_unit, role, department_id)
    VALUES ('082100000001', 'Andi Software', 'TKN-SW-01', 'DSTI', 'TEKNISI', dep_software)
    ON CONFLICT (phone_number) DO UPDATE SET department_id = dep_software;

    -- Insert Teknisi Hardware
    INSERT INTO users (phone_number, name, identity_number, faculty_unit, role, department_id)
    VALUES ('082100000002', 'Budi Hardware', 'TKN-HW-01', 'DSTI', 'TEKNISI', dep_hardware)
    ON CONFLICT (phone_number) DO UPDATE SET department_id = dep_hardware;

    -- Insert Teknisi Jaringan
    INSERT INTO users (phone_number, name, identity_number, faculty_unit, role, department_id)
    VALUES ('082100000003', 'Citra Jaringan', 'TKN-NW-01', 'DSTI', 'TEKNISI', dep_jaringan)
    ON CONFLICT (phone_number) DO UPDATE SET department_id = dep_jaringan;

    -- Insert Teknisi Keamanan
    INSERT INTO users (phone_number, name, identity_number, faculty_unit, role, department_id)
    VALUES ('082100000004', 'Deni Keamanan', 'TKN-SEC-01', 'DSTI', 'TEKNISI', dep_keamanan)
    ON CONFLICT (phone_number) DO UPDATE SET department_id = dep_keamanan;

    -- Update atau Insert Akun Operator Default
    INSERT INTO users (phone_number, name, identity_number, faculty_unit, role)
    VALUES ('089900000000', 'Admin Operator Utama', 'OP-001', 'Helpdesk Center', 'OPERATOR_HELPDESK')
    ON CONFLICT (phone_number) DO NOTHING;
END $$;
