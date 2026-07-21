-- =====================================================================================
-- HALODESK IT UNDIP - UPDATE STAFF SCHEMA
-- Copy dan paste script ini ke SQL Editor di Dashboard Supabase lalu klik 'RUN'
-- =====================================================================================

-- 1. Buat Tabel Teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    status BOOLEAN DEFAULT true, -- true = Active, false = Disabled
    team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Buat Tabel Relasi User - Teams (Banyak agen bisa di banyak tim)
CREATE TABLE IF NOT EXISTS user_teams (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    alerts_enabled BOOLEAN DEFAULT true,
    PRIMARY KEY (user_id, team_id)
);

-- 3. Update Tabel Departments (tambahkan kolom pelengkap)
-- Gunakan DO block untuk cek kolom eksis agar tidak error jika dijalankan dua kali
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE departments ADD COLUMN status BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE departments ADD COLUMN type VARCHAR(50) DEFAULT 'Public';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE departments ADD COLUMN email_address VARCHAR(255);
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    
    BEGIN
        ALTER TABLE departments ADD COLUMN manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 4. Update Tabel Users (tambahkan username, notes, dan settings)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN internal_notes TEXT;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN limit_ticket_access BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN vacation_mode BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;
