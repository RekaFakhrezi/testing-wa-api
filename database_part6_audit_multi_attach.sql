-- ==========================================
-- MIGRATION PART 6: AUDIT LOG & MULTI ATTACHMENT
-- ==========================================

-- ==========================================
-- 1. TICKET LOGS (Menggantikan audit_logs)
-- ==========================================

DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE IF NOT EXISTS ticket_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket_id ON ticket_logs(ticket_id);

-- ==========================================
-- 2. TICKET ATTACHMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size INT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_message_id ON ticket_attachments(ticket_message_id);

-- Note: Kita biarkan kolom attachment_url lama di tabel tickets dan ticket_messages
-- untuk sementara agar fitur/testing lama tidak langsung error (backward compatibility).
-- Ke depannya kita akan sepenuhnya mengandalkan ticket_attachments.
