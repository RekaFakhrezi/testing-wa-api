-- ==========================================
-- MIGRATION PART 1: TIMELINE & CATEGORY
-- ==========================================

-- 1. Create ENUM for message sender
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type_enum') THEN
        CREATE TYPE sender_type_enum AS ENUM ('USER', 'HELPDESK', 'TEKNISI', 'SYSTEM');
    END IF;
END $$;

-- 2. Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type sender_type_enum NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    attachment_url VARCHAR(255),
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat query timeline
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);

-- Opsional: Jika Anda ingin memindahkan isi 'description' lama ke ticket_messages secara otomatis:
-- (Hapus komentar di bawah jika ingin dijalankan)
/*
INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message, created_at)
SELECT id, 'USER'::sender_type_enum, reporter_id, description, created_at
FROM tickets
WHERE NOT EXISTS (
    SELECT 1 FROM ticket_messages WHERE ticket_messages.ticket_id = tickets.id
);
*/
