-- ==========================================
-- MIGRATION PART 8: WEBHOOK LOGS & SYSTEM CONFIGS
-- ==========================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    direction VARCHAR(20) NOT NULL, -- 'INCOMING' or 'OUTGOING'
    phone_number VARCHAR(20),
    payload TEXT,
    status VARCHAR(50), -- 'SUCCESS', 'FAILED'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_direction ON webhook_logs(direction);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_phone ON webhook_logs(phone_number);


CREATE TABLE IF NOT EXISTS system_configs (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Bot Welcome Message
INSERT INTO system_configs (key, value, description)
VALUES (
    'bot_welcome_message',
    '🤖 *Halo! Pusat Bantuan IT Universitas Diponegoro.*\nSilakan balas dengan *angka*:\n*1.* 📝 Buat Tiket\n*2.* 🔍 Cek Status\n*3.* ➕ Tambah Info\n*4.* 📚 FAQ & Panduan\n*5.* 📞 Hubungi Petugas\n*0.* ❌ Akhiri\n\n⚠️ Jangan pernah mengirimkan Password / OTP!',
    'Pesan utama (Main Menu) saat pengguna pertama kali berinteraksi dengan bot WhatsApp.'
) ON CONFLICT (key) DO NOTHING;
