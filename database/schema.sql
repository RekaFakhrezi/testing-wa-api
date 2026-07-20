-- ==========================================
-- HALODESK IT UNDIP - FULL DATABASE SCHEMA
-- Gunakan script ini untuk Fresh Install di Supabase
-- ==========================================

-- 1. DROP EXISTING TABLES & ENUMS (JIKA ADA)
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS faq_categories CASCADE;
DROP TABLE IF EXISTS sla_configs CASCADE;
DROP TABLE IF EXISTS wa_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ticket_logs CASCADE;
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP SEQUENCE IF EXISTS ticket_number_seq CASCADE;

-- 2. CREATE EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('PELAPOR', 'OPERATOR_HELPDESK', 'TEKNISI', 'ADMINISTRATOR', 'PIMPINAN');
CREATE TYPE ticket_status AS ENUM ('Open', 'Diproses', 'Selesai/Close', 'Ditolak/Dibatalkan', 'Dibuka Kembali/Reopen');
CREATE TYPE priority_level AS ENUM ('Kritis', 'Tinggi', 'Sedang', 'Rendah');

CREATE SEQUENCE ticket_number_seq START 1;

-- 3. CREATE TABLES

-- Departemen / Unit Kerja Teknisi
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pengguna Sistem
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    identity_number VARCHAR(50),
    faculty_unit VARCHAR(100),
    role user_role DEFAULT 'PELAPOR' NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kategori Layanan
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1 NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tiket Layanan
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Lampiran Tiket
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_url VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log Interaksi / Komentar Tiket
CREATE TABLE ticket_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Sistem
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session WhatsApp Bot
CREATE TABLE wa_sessions (
    phone_number VARCHAR(20) PRIMARY KEY REFERENCES users(phone_number) ON DELETE CASCADE,
    step VARCHAR(50) DEFAULT 'IDLE' NOT NULL,
    temp_data JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pengaturan SLA
CREATE TABLE sla_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    priority_level VARCHAR(20) UNIQUE NOT NULL,
    response_time_minutes INTEGER NOT NULL,
    resolution_time_minutes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kategori FAQ
CREATE TABLE faq_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE INDEXES
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_category_id ON tickets(category_id);
CREATE INDEX idx_tickets_reporter_id ON tickets(reporter_id);
CREATE INDEX idx_tickets_technician_id ON tickets(technician_id);
CREATE INDEX idx_ticket_logs_ticket_id ON ticket_logs(ticket_id);
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);

-- 5. INSERT SEED DATA

-- A. SLA Default
INSERT INTO sla_configs (priority_level, response_time_minutes, resolution_time_minutes) VALUES
('Kritis', 15, 60),
('Tinggi', 30, 240),
('Sedang', 60, 480),
('Rendah', 120, 1440);

-- B. Root Categories
INSERT INTO categories (name, description, level, sort_order) VALUES
('Aplikasi / Software', 'Kendala aplikasi internal UNDIP', 1, 1),
('Jaringan & Internet', 'Kendala konektivitas Eduroam dan VPN', 1, 2),
('Hardware & Infrastruktur', 'Kendala perangkat keras', 1, 3),
('Lainnya', 'Layanan IT lainnya yang tidak tercantum', 1, 4);

-- C. Departemen
INSERT INTO departments (name, description) VALUES
('Unit Software & Aplikasi', 'Menangani kendala software, aplikasi web, dan sistem internal'),
('Unit Hardware & Perangkat', 'Menangani kendala PC, Printer, Scanner, dan perangkat lab'),
('Unit Jaringan & Infrastruktur', 'Menangani koneksi internet, server, dan jaringan wifi'),
('Unit Keamanan Siber', 'Menangani kendala keamanan dan peretasan');
