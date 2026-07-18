-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('PELAPOR', 'OPERATOR_HELPDESK', 'TEKNISI', 'ADMINISTRATOR', 'PIMPINAN');
CREATE TYPE ticket_status AS ENUM ('Open', 'Diproses', 'Selesai/Close', 'Ditolak/Dibatalkan', 'Dibuka Kembali/Reopen');
CREATE TYPE priority_level AS ENUM ('Kritis', 'Tinggi', 'Sedang', 'Rendah');

-- 2. Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create Tables
CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
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

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wa_sessions (
    phone_number VARCHAR(20) PRIMARY KEY REFERENCES users(phone_number) ON DELETE CASCADE,
    step VARCHAR(50) DEFAULT 'IDLE' NOT NULL,
    temp_data JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter_id ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_technician_id ON tickets(technician_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ticket_id ON audit_logs(ticket_id);

-- 5. Insert Default Categories (For WA Bot Topic Selection)
INSERT INTO categories (name, description) VALUES
('Aplikasi (SSO, SIAP, Gentayu, dsb)', 'Layanan aplikasi internal UNDIP'),
('Website dan Email', 'Kendala website resmi dan email UNDIP'),
('Jaringan dan Internet (WiFi, VPN)', 'Kendala konektivitas Eduroam dan VPN'),
('Cyber dan Keamanan Sistem', 'Pelaporan keamanan data dan peretasan'),
('Lainnya', 'Layanan IT lainnya yang tidak tercantum');
