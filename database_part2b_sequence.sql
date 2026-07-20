-- ==========================================
-- MIGRATION PART 2B: SEQUENCE NUMBER GENERATOR
-- ==========================================

-- 1. Create Sequence Table
CREATE TABLE IF NOT EXISTS daily_ticket_seq (
    date_val DATE PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

-- 2. Create Generator Function (Thread-Safe / Transactional)
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    seq_val INT;
    date_str TEXT;
BEGIN
    INSERT INTO daily_ticket_seq (date_val, last_seq)
    VALUES (today_date, 1)
    ON CONFLICT (date_val) DO UPDATE 
    SET last_seq = daily_ticket_seq.last_seq + 1
    RETURNING last_seq INTO seq_val;

    -- Format YYYYMMDD
    date_str := to_char(today_date, 'YYYYMMDD');
    
    -- Format HD-YYYYMMDD-0001
    RETURN 'HD-' || date_str || '-' || lpad(seq_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Set Default Value on tickets.ticket_number
ALTER TABLE tickets ALTER COLUMN ticket_number SET DEFAULT generate_ticket_number();
