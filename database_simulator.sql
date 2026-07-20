-- ==========================================
-- MIGRATION: WHATSAPP SIMULATOR
-- ==========================================

CREATE TABLE IF NOT EXISTS mock_wa_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('in', 'out')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Jika ingin menggunakan Supabase Realtime di UI, pastikan replica identity diset (opsional):
ALTER TABLE mock_wa_messages REPLICA IDENTITY FULL;
