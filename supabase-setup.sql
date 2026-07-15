-- =======================================================
-- 1. BUAT TABEL WA_USERS
-- =======================================================
CREATE TABLE IF NOT EXISTS public.wa_users (
    phone_number text PRIMARY KEY,
    name text,
    nim text,
    created_at timestamp with time zone DEFAULT now()
);

-- =======================================================
-- 2. BUAT TABEL WA_SESSIONS
-- =======================================================
CREATE TABLE IF NOT EXISTS public.wa_sessions (
    phone_number text PRIMARY KEY,
    step text DEFAULT 'IDLE',
    temp_data jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- =======================================================
-- 3. PERBARUI TABEL WA_TICKETS
-- =======================================================
-- Tambahkan kolom baru
ALTER TABLE public.wa_tickets ADD COLUMN IF NOT EXISTS ticket_number text UNIQUE;
ALTER TABLE public.wa_tickets ADD COLUMN IF NOT EXISTS help_topic text;
ALTER TABLE public.wa_tickets ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.wa_tickets ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;

-- Perbarui status yang lama 'waiting_for_user' menjadi 'resolved' jika ada
UPDATE public.wa_tickets SET status = 'resolved' WHERE status = 'waiting_for_user';

-- =======================================================
-- 4. BUAT STORAGE BUCKET UNTUK LAMPIRAN
-- =======================================================
-- Hapus jika sudah ada (opsional), buat bucket public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Buat policy agar semua orang bisa melihat public bucket ini (optional for simple usage)
CREATE POLICY "Public Access for Ticket Attachments" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'ticket-attachments' );

-- =======================================================
-- 5. AUTO-CLOSE CRON JOB (PG_CRON)
-- =======================================================
-- Ekstensi pg_cron biasanya sudah aktif di Supabase. 
-- Script ini akan mengecek tiket setiap hari jam 00:00 (tengah malam).
-- Jika tiket berstatus 'resolved' dan umurnya lebih dari 2 hari sejak 'resolved_at', 
-- ubah statusnya menjadi 'closed'.
SELECT cron.schedule(
    'auto-close-tickets',
    '0 0 * * *',
    $$
        UPDATE public.wa_tickets 
        SET status = 'closed' 
        WHERE status = 'resolved' 
          AND resolved_at < NOW() - INTERVAL '2 days';
    $$
);

-- =======================================================
-- 6. PERBARUI STATUS CONSTRAINT
-- =======================================================
ALTER TABLE public.wa_tickets DROP CONSTRAINT IF EXISTS wa_tickets_status_check;
ALTER TABLE public.wa_tickets ADD CONSTRAINT wa_tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
