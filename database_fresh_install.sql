-- ==========================================
-- DANGER ZONE: DROP OLD & EXISTING TABLES
-- ==========================================
-- Hapus tabel versi baru (jika ada)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS wa_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Hapus tabel versi lama (sebelum refactor)
DROP TABLE IF EXISTS wa_tickets CASCADE;
DROP TABLE IF EXISTS wa_users CASCADE;

-- Hapus Enum lama (jika ada)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;

-- ==========================================
-- PHASE 1: MENGAKTIFKAN EKSTENSI
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PHASE 2: MEMBUAT ENUM
-- ==========================================
CREATE TYPE user_role AS ENUM ('PELAPOR', 'OPERATOR_HELPDESK', 'TEKNISI', 'ADMINISTRATOR', 'PIMPINAN');
CREATE TYPE ticket_status AS ENUM ('Open', 'Diproses', 'Selesai/Close', 'Ditolak/Dibatalkan', 'Dibuka Kembali/Reopen');
CREATE TYPE priority_level AS ENUM ('Kritis', 'Tinggi', 'Sedang', 'Rendah');

-- ==========================================
-- PHASE 3: MEMBUAT TABEL UTAMA
-- ==========================================

-- 1. Tabel Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    identity_number VARCHAR(50),
    faculty_unit VARCHAR(100),
    role user_role DEFAULT 'PELAPOR' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    subject VARCHAR(255),
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'Open' NOT NULL,
    sub_status VARCHAR(50),
    priority priority_level,
    operator_id UUID REFERENCES users(id),
    technician_id UUID REFERENCES users(id),
    attachment_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 4. Tabel Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel State Machine WA
CREATE TABLE wa_sessions (
    phone_number VARCHAR(20) PRIMARY KEY REFERENCES users(phone_number) ON DELETE CASCADE,
    step VARCHAR(50) DEFAULT 'IDLE' NOT NULL,
    temp_data JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PHASE 4: MEMBUAT INDEX UNTUK PERFORMA
-- ==========================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone_number);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_category_id ON tickets(category_id);
CREATE INDEX idx_tickets_reporter_id ON tickets(reporter_id);
CREATE INDEX idx_tickets_technician_id ON tickets(technician_id);

CREATE INDEX idx_audit_logs_ticket_id ON audit_logs(ticket_id);

-- ==========================================
-- PHASE 5: MENGISI DATA DEFAULT AWAL
-- ==========================================

-- A. Insert Default Categories
INSERT INTO categories (name, description) VALUES
('Aplikasi (SSO, SIAP, Gentayu, dsb)', 'Layanan aplikasi internal UNDIP'),
('Website dan Email', 'Kendala website resmi dan email UNDIP'),
('Jaringan dan Internet (WiFi, VPN)', 'Kendala konektivitas Eduroam dan VPN'),
('Cyber dan Keamanan Sistem', 'Pelaporan keamanan data dan peretasan'),
('Lainnya', 'Layanan IT lainnya yang tidak tercantum');

-- B. Insert Akun Dummy untuk Teknisi agar bisa ditugaskan di Dashboard
INSERT INTO users (phone_number, name, identity_number, faculty_unit, role) VALUES
('081234567890', 'Budi Teknisi Jaringan', 'TKN-001', 'DSTI Pusat', 'TEKNISI'),
('081234567891', 'Siti Teknisi Software', 'TKN-002', 'DSTI Pusat', 'TEKNISI');
